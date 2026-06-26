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
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  subscription: SubscriptionTier;
  followersCount: number;
  followingCount: number;
  dailyStreamsCount: number;
  birthDate?: string;
  gender?: Gender;
  createdAt: string;
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
