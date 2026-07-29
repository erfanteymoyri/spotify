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
