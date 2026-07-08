import { calculateArtistReward, DEFAULT_PRICING } from "@/lib/rewards";
import { createId, readJson, writeJson } from "@/lib/local-store";
import { mockArtists } from "@/lib/mock-data";
import type {
  ArtistPayout,
  SubscriptionPricing,
  SupportTicket,
  TicketMessage,
} from "@/types";

const TICKETS_KEY = "spotify-support-tickets";
const PAYOUTS_KEY = "spotify-artist-payouts";
const PRICING_KEY = "spotify-subscription-pricing";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function seedTickets(): SupportTicket[] {
  const now = Date.now();
  return [
    {
      id: createId("ticket"),
      userId: "user-1",
      userName: "شنونده نمونه",
      subject: "پرداخت اشتراک ناموفق بود",
      status: "open",
      createdAt: new Date(now - 2 * 3_600_000).toISOString(),
      messages: [
        {
          id: createId("msg"),
          senderRole: "user",
          content:
            "سلام، مبلغ از حسابم کسر شد اما اشتراک طلایی فعال نشد. لطفاً بررسی کنید.",
          createdAt: new Date(now - 2 * 3_600_000).toISOString(),
        },
      ],
    },
    {
      id: createId("ticket"),
      userId: "user-2",
      userName: "کاربر نقره‌ای",
      subject: "امکان دانلود آهنگ وجود ندارد",
      status: "answered",
      createdAt: new Date(now - 26 * 3_600_000).toISOString(),
      messages: [
        {
          id: createId("msg"),
          senderRole: "user",
          content: "چرا نمی‌توانم آهنگ‌ها را دانلود کنم؟",
          createdAt: new Date(now - 26 * 3_600_000).toISOString(),
        },
        {
          id: createId("msg"),
          senderRole: "support",
          content:
            "دانلود آهنگ نیازمند اشتراک نقره‌ای یا طلایی فعال است. لطفاً وضعیت اشتراک خود را بررسی کنید.",
          createdAt: new Date(now - 25 * 3_600_000).toISOString(),
        },
      ],
    },
  ];
}

function seedPayouts(): ArtistPayout[] {
  const month = currentMonth();
  return mockArtists.map((artist) => {
    const uniqueListeners = artist.totalListeners ?? 0;
    const totalStreams = artist.totalStreams ?? 0;
    return {
      id: createId("payout"),
      artistId: artist.id,
      artistName: artist.stageName,
      uniqueListeners,
      totalStreams,
      amount: calculateArtistReward(uniqueListeners, totalStreams),
      status: "pending",
      month,
    };
  });
}

export const adminMockStorage = {
  getTickets(): SupportTicket[] {
    const stored = readJson<SupportTicket[] | null>(TICKETS_KEY, null);
    if (!stored?.length) {
      const seeded = seedTickets();
      writeJson(TICKETS_KEY, seeded);
      return seeded;
    }
    return stored;
  },

  getTicket(id: string): SupportTicket | undefined {
    return this.getTickets().find((ticket) => ticket.id === id);
  },

  replyToTicket(id: string, content: string): SupportTicket | undefined {
    const message: TicketMessage = {
      id: createId("msg"),
      senderRole: "support",
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    const tickets = this.getTickets().map((ticket) =>
      ticket.id === id
        ? {
            ...ticket,
            status: "answered" as const,
            messages: [...ticket.messages, message],
          }
        : ticket,
    );
    writeJson(TICKETS_KEY, tickets);
    return tickets.find((ticket) => ticket.id === id);
  },

  getPayouts(): ArtistPayout[] {
    const stored = readJson<ArtistPayout[] | null>(PAYOUTS_KEY, null);
    if (!stored?.length) {
      const seeded = seedPayouts();
      writeJson(PAYOUTS_KEY, seeded);
      return seeded;
    }
    return stored;
  },

  settlePayout(id: string): void {
    const payouts = this.getPayouts().map((payout) =>
      payout.id === id ? { ...payout, status: "paid" as const } : payout,
    );
    writeJson(PAYOUTS_KEY, payouts);
  },

  getPricing(): SubscriptionPricing {
    return readJson<SubscriptionPricing>(PRICING_KEY, DEFAULT_PRICING);
  },

  updatePricing(pricing: SubscriptionPricing): SubscriptionPricing {
    writeJson(PRICING_KEY, pricing);
    return pricing;
  },
};
