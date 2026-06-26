import type {
  Album,
  ArtistProfile,
  HomeFeed,
  Notification,
  Playlist,
  SubscriptionPlan,
  Track,
  User,
  UserSettings,
} from "@/types";

const PLACEHOLDER_COVER =
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop";

/** Sample audio file — use real stream URLs from the backend in production */
const PLACEHOLDER_AUDIO =
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

export const mockCurrentUser: User = {
  id: "user-1",
  username: "erfan_music",
  displayName: "عرفان",
  email: "erfan@example.com",
  role: "listener",
  avatarUrl: null,
  subscription: "silver",
  followersCount: 42,
  followingCount: 18,
  dailyStreamsCount: 12,
  birthDate: "2000-01-15",
  gender: "male",
  createdAt: "2025-09-01T00:00:00Z",
};

export const mockArtists: ArtistProfile[] = [
  {
    id: "artist-1",
    userId: "artist-user-1",
    stageName: "سهراب پاکزاد",
    bio: "خواننده پاپ ایرانی",
    isVerified: true,
    status: "approved",
    followersCount: 125000,
    totalListeners: 89000,
    totalStreams: 1250000,
  },
  {
    id: "artist-2",
    userId: "artist-user-2",
    stageName: "همایون شجریان",
    bio: "استاد موسیقی سنتی",
    isVerified: true,
    status: "approved",
    followersCount: 98000,
    totalListeners: 72000,
    totalStreams: 980000,
  },
];

export const mockTracks: Track[] = [
  {
    id: "track-1",
    title: "عشق من",
    artistId: "artist-1",
    artistName: "سهراب پاکزاد",
    albumId: "album-1",
    albumName: "عشق من",
    coverUrl: PLACEHOLDER_COVER,
    audioUrl: PLACEHOLDER_AUDIO,
    duration: 245,
    lyrics: "متن آهنگ نمونه...",
    genre: "پاپ",
    releaseYear: 2024,
    listenersCount: 45000,
    streamsCount: 120000,
    publishedAt: "2024-06-01T00:00:00Z",
  },
  {
    id: "track-2",
    title: "شب یلدا",
    artistId: "artist-2",
    artistName: "همایون شجریان",
    albumId: "album-2",
    albumName: "شب یلدا",
    coverUrl: PLACEHOLDER_COVER,
    audioUrl: PLACEHOLDER_AUDIO,
    duration: 312,
    genre: "سنتی",
    releaseYear: 2023,
    listenersCount: 38000,
    streamsCount: 95000,
    publishedAt: "2023-12-20T00:00:00Z",
  },
  {
    id: "track-3",
    title: "آسمان",
    artistId: "artist-1",
    artistName: "سهراب پاکزاد",
    albumId: null,
    albumName: null,
    coverUrl: PLACEHOLDER_COVER,
    audioUrl: PLACEHOLDER_AUDIO,
    duration: 198,
    genre: "پاپ",
    releaseYear: 2025,
    listenersCount: 22000,
    streamsCount: 55000,
    publishedAt: "2025-01-10T00:00:00Z",
  },
  {
    id: "track-4",
    title: "پاییز",
    artistId: "artist-2",
    artistName: "همایون شجریان",
    albumId: "album-2",
    albumName: "شب یلدا",
    coverUrl: PLACEHOLDER_COVER,
    audioUrl: PLACEHOLDER_AUDIO,
    duration: 276,
    genre: "سنتی",
    releaseYear: 2023,
    listenersCount: 31000,
    streamsCount: 78000,
    publishedAt: "2023-12-20T00:00:00Z",
  },
];

export const mockAlbums: Album[] = [
  {
    id: "album-1",
    title: "عشق من",
    artistId: "artist-1",
    artistName: "سهراب پاکزاد",
    coverUrl: PLACEHOLDER_COVER,
    releaseDate: "2024-06-01",
    genre: "پاپ",
    trackIds: ["track-1"],
  },
  {
    id: "album-2",
    title: "شب یلدا",
    artistId: "artist-2",
    artistName: "همایون شجریان",
    coverUrl: PLACEHOLDER_COVER,
    releaseDate: "2023-12-20",
    genre: "سنتی",
    trackIds: ["track-2", "track-4"],
  },
];

export const mockPlaylists: Playlist[] = [
  {
    id: "playlist-1",
    name: "محبوب‌ترین‌ها",
    ownerId: "user-1",
    coverUrl: PLACEHOLDER_COVER,
    trackIds: ["track-1", "track-2", "track-3"],
    createdAt: "2025-10-01T00:00:00Z",
    updatedAt: "2025-12-01T00:00:00Z",
  },
  {
    id: "playlist-2",
    name: "برای مطالعه",
    ownerId: "user-1",
    coverUrl: null,
    trackIds: ["track-4"],
    createdAt: "2025-11-15T00:00:00Z",
    updatedAt: "2025-11-15T00:00:00Z",
  },
];

export const mockHomeFeed: HomeFeed = {
  recentlyPlayedPlaylists: mockPlaylists,
  latestAlbums: mockAlbums,
  popularTracks: mockTracks,
  earlyAccessTracks: [mockTracks[2]],
};

export const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    type: "new_release",
    title: "اثر جدید",
    message: "سهراب پاکزاد آهنگ «آسمان» را منتشر کرد.",
    isRead: false,
    createdAt: "2025-06-20T10:00:00Z",
    link: "/artist/artist-1",
  },
  {
    id: "notif-2",
    type: "subscription_expiry",
    title: "پایان اشتراک",
    message: "اشتراک نقره‌ای شما ۵ روز دیگر منقضی می‌شود.",
    isRead: true,
    createdAt: "2025-06-18T08:00:00Z",
  },
];

export const mockSettings: UserSettings = {
  notificationsEnabled: true,
  volume: 0.75,
  language: "fa",
};

export const mockSubscriptionPlans: SubscriptionPlan[] = [
  {
    tier: "free",
    name: "پایه",
    price: 0,
    currency: "IRR",
    maxDailyStreams: 60,
    maxPlaylists: 6,
    canUploadAvatar: false,
    canDownload: false,
    hasEarlyAccess: false,
    canViewStats: false,
  },
  {
    tier: "silver",
    name: "نقره‌ای",
    price: 99000,
    currency: "IRR",
    maxDailyStreams: 100,
    maxPlaylists: 100,
    canUploadAvatar: true,
    canDownload: true,
    hasEarlyAccess: false,
    canViewStats: false,
  },
  {
    tier: "gold",
    name: "طلایی",
    price: 199000,
    currency: "IRR",
    maxDailyStreams: null,
    maxPlaylists: null,
    canUploadAvatar: true,
    canDownload: true,
    hasEarlyAccess: true,
    canViewStats: true,
  },
];

export function getTrackById(id: string): Track | undefined {
  return mockTracks.find((t) => t.id === id);
}

export function getAlbumById(id: string): Album | undefined {
  return mockAlbums.find((a) => a.id === id);
}

export function getArtistById(id: string): ArtistProfile | undefined {
  return mockArtists.find((a) => a.id === id);
}

export function getPlaylistById(id: string): Playlist | undefined {
  return mockPlaylists.find((p) => p.id === id);
}

export function getAlbumTracks(albumId: string): Track[] {
  const album = getAlbumById(albumId);
  if (!album) return [];
  return album.trackIds
    .map((id) => getTrackById(id))
    .filter((t): t is Track => t !== undefined);
}

export function getPlaylistTracks(playlistId: string): Track[] {
  const playlist = getPlaylistById(playlistId);
  if (!playlist) return [];
  return playlist.trackIds
    .map((id) => getTrackById(id))
    .filter((t): t is Track => t !== undefined);
}
