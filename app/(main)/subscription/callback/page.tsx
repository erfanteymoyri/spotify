"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, RotateCcw, XCircle } from "lucide-react";
import { FadeIn } from "@/components/shared/motion";
import { Button } from "@/ui/button";
import { routes } from "@/config/site";
import { useTranslation } from "@/hooks/use-translation";
import { formatNumber } from "@/lib/format";
import { authService } from "@/services/auth.service";
import { subscriptionService } from "@/services/subscription.service";
import { useAuthStore } from "@/stores/auth-store";
import type { Payment } from "@/types";
import { cn } from "@/lib/utils";

/** How long the success screen lingers before it takes the user onwards. */
const REDIRECT_SECONDS = 10;

/**
 * Where the payment gateway's callback sends the browser.
 *
 * The backend has already confirmed the transaction with the gateway by the
 * time anyone gets here — this page reports a decision, it does not make one.
 * It re-fetches the payment over the authenticated API rather than believing
 * the query string, which the user can edit: the URL says *which* transaction
 * came back, the API says what became of it.
 */
export default function PaymentCallbackPage() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <p className="py-20 text-center text-muted-foreground">
          {t("common.loading")}
        </p>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}

/** The three outcomes the backend can hand back, plus the pre-answer state. */
type Outcome = "loading" | "succeeded" | "failed" | "pending";

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const updateUser = useAuthStore((s) => s.updateUser);

  const paymentId = searchParams.get("payment");
  // Which failure message to show, when there is no record to read. It cannot
  // manufacture a success: only the fetched payment can do that.
  const reason = searchParams.get("reason");

  const [payment, setPayment] = useState<Payment | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(
    paymentId ? "loading" : "failed",
  );

  useEffect(() => {
    if (!paymentId) return;
    let cancelled = false;

    subscriptionService
      .getPayment(paymentId)
      .then((record) => {
        if (cancelled) return;
        setPayment(record);
        // `PaymentStatus` and the outcomes this page renders are the same three
        // states, so the record's status is the outcome.
        setOutcome(record.status);

        // The tier changed server-side while the user was at the bank, so the
        // cached user is a version behind — every gated feature would still
        // read as locked until the next reload without this.
        if (record.status === "succeeded") {
          authService.getMe().then(updateUser).catch(() => {});
        }
      })
      .catch(() => {
        if (cancelled) return;
        // The record is unreadable — a stale link, or an id that is not this
        // user's. Never fall back to the query string's claim: a success screen
        // must be backed by a payment the server confirmed, or the URL alone
        // could be edited into one.
        setOutcome("failed");
      });

    return () => {
      cancelled = true;
    };
  }, [paymentId, updateUser]);

  if (outcome === "loading") {
    return (
      <p className="py-20 text-center text-muted-foreground">
        {t("subscription.verifying")}
      </p>
    );
  }

  return (
    <FadeIn className="mx-auto max-w-lg py-10">
      {outcome === "succeeded" ? (
        <SuccessCard payment={payment} />
      ) : outcome === "pending" ? (
        <PendingCard payment={payment} />
      ) : (
        <FailureCard reason={reason} onRetry={() => router.push(routes.subscription)} />
      )}
    </FadeIn>
  );
}

/* -------------------------------------------------------------------------- */
/* Outcomes                                                                    */
/* -------------------------------------------------------------------------- */

function SuccessCard({ payment }: { payment: Payment | null }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [seconds, setSeconds] = useState(REDIRECT_SECONDS);

  const goHome = useCallback(() => router.replace(routes.home), [router]);

  /**
   * Count down to the automatic redirect.
   *
   * `replace`, not `push`: the browser's back button should not walk the user
   * into a spent callback URL. The timer drives a single state value and the
   * navigation happens when it runs out, so the interval cannot fire twice.
   */
  useEffect(() => {
    const timer = setInterval(
      () => setSeconds((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (seconds === 0) goHome();
  }, [seconds, goHome]);

  return (
    <ResultCard
      tone="success"
      icon={<CheckCircle2 className="size-12" />}
      title={t("subscription.successTitle")}
      description={t("subscription.successMessage")}
      payment={payment}
      footer={
        <>
          <Button className="w-full" onClick={goHome}>
            {t("subscription.goHome")}
          </Button>
          <p
            className="text-center text-xs text-muted-foreground"
            aria-live="polite"
          >
            {t("subscription.redirectingIn", { seconds })}
          </p>
        </>
      }
    />
  );
}

function FailureCard({
  reason,
  onRetry,
}: {
  reason: string | null;
  onRetry: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();

  // A closed vocabulary from the backend, so the sentence the user reads is
  // translated here alongside every other string in the app.
  const description =
    reason === "cancelled"
      ? t("subscription.reasonCancelled")
      : reason === "unverified"
        ? t("subscription.reasonUnverified")
        : reason === "not_found"
          ? t("subscription.reasonNotFound")
          : t("subscription.reasonUnknown");

  return (
    <ResultCard
      tone="failure"
      icon={<XCircle className="size-12" />}
      title={t("subscription.failureTitle")}
      description={description}
      payment={null}
      footer={
        <>
          <Button className="w-full" onClick={onRetry}>
            <RotateCcw />
            {t("subscription.retry")}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push(routes.home)}
          >
            {t("subscription.backHome")}
          </Button>
        </>
      }
    />
  );
}

/**
 * Paid, but the gateway could not be reached to confirm it.
 *
 * Deliberately offers no "try again": the money may already have left the
 * customer's account, and inviting a second attempt is how someone pays twice.
 */
function PendingCard({ payment }: { payment: Payment | null }) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <ResultCard
      tone="pending"
      icon={<Clock className="size-12" />}
      title={t("subscription.pendingTitle")}
      description={t("subscription.pendingMessage")}
      payment={payment}
      footer={
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push(routes.home)}
        >
          {t("subscription.backHome")}
        </Button>
      }
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Shared shell                                                                */
/* -------------------------------------------------------------------------- */

const TONES = {
  success: "border-primary/40 bg-primary/5 text-primary",
  failure: "border-destructive/40 bg-destructive/5 text-destructive",
  pending: "border-amber-500/40 bg-amber-500/5 text-amber-500",
} as const;

function ResultCard({
  tone,
  icon,
  title,
  description,
  payment,
  footer,
}: {
  tone: keyof typeof TONES;
  icon: React.ReactNode;
  title: string;
  description: string;
  payment: Payment | null;
  footer: React.ReactNode;
}) {
  const { t } = useTranslation();

  // Only rows the gateway actually filled in — an empty "tracking number:" line
  // reads as something having gone wrong.
  const details: { label: string; value: string }[] = [];
  if (payment) {
    if (payment.trackingNumber) {
      details.push({
        label: t("subscription.trackingNumber"),
        value: payment.trackingNumber,
      });
    }
    details.push({
      label: t("subscription.amountPaid"),
      value: `${formatNumber(payment.amount)} ${t("subscription.toman")}`,
    });
    if (payment.cardNumber) {
      details.push({
        label: t("subscription.cardNumber"),
        value: payment.cardNumber,
      });
    }
    if (payment.bank) {
      details.push({ label: t("subscription.bank"), value: payment.bank });
    }
    details.push({ label: t("subscription.transactionId"), value: payment.id });
  }

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-6 sm:p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className={cn(
            "flex size-20 items-center justify-center rounded-full border",
            TONES[tone],
          )}
        >
          {icon}
        </div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      {details.length > 0 && (
        <dl className="mt-6 space-y-2.5 rounded-xl border border-border bg-background/40 p-4 text-sm">
          {details.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-4"
            >
              <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
              <dd
                dir="ltr"
                className="truncate font-medium tabular-nums"
                title={row.value}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-6 space-y-2.5">{footer}</div>
    </div>
  );
}
