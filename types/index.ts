export type UserRole = "listener" | "artist" | "support" | "admin";

export type SubscriptionTier = "free" | "silver" | "gold";

export type Gender = "male" | "female" | "other";

export type ArtistStatus = "pending" | "approved" | "rejected";

export type RepeatMode = "off" | "all" | "one";

export type NotificationType =
  | "subscription_expiry"
  | "new_release"
  | "artist_approval"
  | "artist_rejection"
  | "monthly_payout"
  | "new_ticket"
  | "artist_verification_request";

export interface User {
  id: string;
  username: string;
  displayName: string;
  /**
   * Only on your own account. Public profiles omit it, since no screen shows
   * someone else's address and narrow reads are the rule (spec 3.3).
   */
  email?: string;
  role: UserRole;
  avatarUrl: string | null;
  subscription: SubscriptionTier;
  followersCount: number;
  followingCount: number;
  dailyStreamsCount: number;
  birthDate?: string;
  gender?: Gender;
  createdAt: string;
  /** Whether the signed-in viewer follows this user (public profiles only). */
  isFollowing?: boolean;
}

export interface ArtistProfile {
  id: string;
  userId: string;
  stageName: string;
  bio: string;
  isVerified: boolean;
  status: ArtistStatus;
  followersCount: number;
  totalListeners?: number;
  totalStreams?: number;
  sampleWorks?: string;
}

export interface Track {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId: string | null;
  albumName: string | null;
  coverUrl: string;
  audioUrl: string;
  duration: number;
  lyrics?: string | null;
  genre?: string;
  releaseYear?: number;
  listenersCount?: number;
  streamsCount?: number;
  publishedAt: string;
  /**
   * Still inside the gold-only early-access window.
   *
   * Purely a hint for the "new release" badge — anything that reaches the
   * client has already passed the server's embargo, so this never decides
   * whether something may be played.
   */
  isEarlyAccess: boolean;
  /** Position within its album; 1 for a single. */
  trackNumber: number;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  coverUrl: string;
  releaseDate: string;
  genre?: string;
  trackIds: string[];
  isEarlyAccess: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  ownerId: string;
  coverUrl: string | null;
  trackIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface HomeFeed {
  recentlyPlayedPlaylists: Playlist[];
  latestAlbums: Album[];
  popularTracks: Track[];
  earlyAccessTracks?: Track[];
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: number;
  currency: string;
  maxDailyStreams: number | null;
  maxPlaylists: number | null;
  canUploadAvatar: boolean;
  canDownload: boolean;
  hasEarlyAccess: boolean;
  canViewStats: boolean;
}

/**
 * One purchasable duration (spec 3.2) with what committing to it saves.
 *
 * `prices` / `fullPrices` are keyed by tier and already resolved by the server,
 * so the client never re-applies the percentage itself — the figure shown is by
 * construction the figure charged at checkout.
 */
export interface BillingOption {
  months: number;
  discountPercent: number;
  /** Cheapest per-month rate; drives the "best value" badge. */
  isBestValue: boolean;
  prices: Partial<Record<SubscriptionTier, number>>;
  fullPrices: Partial<Record<SubscriptionTier, number>>;
}

export interface UserSettings {
  notificationsEnabled: boolean;
  volume: number;
  language: "fa" | "en";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type ReleaseType = "single" | "album";

/** A published track owned by an artist, enriched with per-work analytics */
export interface ArtistWork extends Track {
  releaseType: ReleaseType;
  collaborators: string[];
  revenue: number;
}

/**
 * Metadata the artist upload form produces. The audio and cover files travel
 * alongside it as multipart parts, not as URLs — the backend assigns those once
 * the upload lands in object storage.
 */
export interface ArtistWorkInput {
  title: string;
  releaseType: ReleaseType;
  genre: string;
  releaseYear: number;
  collaborators: string[];
  lyrics: string;
  /** Length in seconds, read from the selected audio file. */
  duration?: number;
  /**
   * Publish straight into one of the artist's existing albums. Only meaningful
   * when `releaseType` is `"album"`; leaving it unset there creates a new album
   * named after the track.
   */
  albumId?: string | null;
}

/** An album as its own artist sees it in the studio: the full tracklist. */
export interface ArtistAlbum extends Album {
  tracks: ArtistWork[];
  trackCount: number;
  publishedAt: string;
}

/** What the album editor collects; the cover travels as a multipart part. */
export interface ArtistAlbumInput {
  title: string;
  genre: string;
  releaseDate?: string;
}

export type TicketStatus = "open" | "answered" | "closed";

export type TicketSenderRole = "user" | "support";

export interface TicketMessage {
  id: string;
  senderRole: TicketSenderRole;
  content: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  status: TicketStatus;
  createdAt: string;
  messages: TicketMessage[];
}

/** Public view of a pending artist verification request (no password) */
export interface ArtistRequest {
  id: string;
  email: string;
  stageName: string;
  sampleWorks: string;
  status: ArtistStatus;
  createdAt: string;
}

export type PayoutStatus = "pending" | "paid";

export interface ArtistPayout {
  id: string;
  artistId: string;
  artistName: string;
  uniqueListeners: number;
  totalStreams: number;
  amount: number;
  status: PayoutStatus;
  month: string;
}

export interface SubscriptionPricing {
  silver: number;
  gold: number;
}

export interface TierDistribution {
  tier: SubscriptionTier;
  count: number;
}

export interface AdminStats {
  tierDistribution: TierDistribution[];
  monthlyRevenue: number;
  totalUsers: number;
  totalArtists: number;
}

export type SubscriptionStatus = "active" | "expired" | "cancelled";

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  durationMonths: number;
  startsAt: string;
  expiresAt: string;
  status: SubscriptionStatus;
  pricePaid: number;
  daysRemaining: number;
  isActive: boolean;
}

/** Spec 3.6 tracks all three gateway outcomes. */
export type PaymentStatus = "pending" | "succeeded" | "failed";

export interface Payment {
  id: string;
  planTier: SubscriptionTier;
  durationMonths: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  failureReason: string;
  createdAt: string;
  settledAt: string | null;
}
