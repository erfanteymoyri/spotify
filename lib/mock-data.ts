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

/**
 * Phase-1 audio sources.
 * Track metadata below is real (titles/artists of actual releases) and the
 * audio files live in `public/audio/` (see its README). Until the backend
 * serves media in phase 2, these files are temporarily committed to the repo.
 * Flip USE_LOCAL_AUDIO to false to fall back to royalty-free SoundHelix
 * streams when the local files are missing.
 */
const USE_LOCAL_AUDIO = true;

function audioFor(trackId: string, sampleNo: number): string {
  return USE_LOCAL_AUDIO
    ? `/audio/${trackId}.mp3`
    : `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${sampleNo}.mp3`;
}

/** Unsplash covers (whitelisted in next.config images.remotePatterns) */
const cover = (id: string) =>
  `https://images.unsplash.com/${id}?w=400&h=400&fit=crop`;

const COVER_IRANE_MAN = cover("photo-1493225457124-a3eb161ffa5f");
const COVER_NA_FERESHTEH = cover("photo-1458560871784-56d23406c091");
const COVER_PLAYLIST = cover("photo-1470225620780-dba8ba36b745");

/* Original artwork of the maddahi singles, stored locally in public/cover */
const COVER_ALSABOOH = "/cover/cover5.jpg";
const COVER_KHANE_MA_NAJAF = "/cover/cover6.jpg";
const COVER_KARIM = "/cover/cover7.jpg";
const COVER_AZ_NAJAF = "/cover/cover8.jpg";
const COVER_HOSSEIN_OOMADE = "/cover/cover9.jpg";
const COVER_BAYAD_BARKHAST = "/cover/cover10.jpg";

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
    stageName: "حسن عطایی",
    bio: "مداح اهل بیت و خواننده مولودی‌های استودیویی؛ خالق آثار «الصبوح» و «حسین اومده».",
    isVerified: true,
    status: "approved",
    followersCount: 210000,
    totalListeners: 150000,
    totalStreams: 2600000,
  },
  {
    id: "artist-2",
    userId: "artist-user-2",
    stageName: "همایون شجریان",
    bio: "خواننده موسیقی سنتی و تلفیقی ایران؛ خالق آلبوم‌های «ایران من» و «نه فرشته‌ام نه شیطان».",
    isVerified: true,
    status: "approved",
    followersCount: 980000,
    totalListeners: 720000,
    totalStreams: 9800000,
  },
  {
    id: "artist-3",
    userId: "artist-user-3",
    stageName: "سید رضا نریمانی",
    bio: "مداح اهل بیت و خواننده مولودی و سرودهای مذهبی استودیویی.",
    isVerified: true,
    status: "approved",
    followersCount: 175000,
    totalListeners: 120000,
    totalStreams: 1900000,
  },
  {
    id: "artist-4",
    userId: "artist-user-4",
    stageName: "علی اکبر حائری",
    bio: "مداح و خواننده مولودی‌های استودیویی؛ از جمله نماهنگ «اختصاصا از نجف».",
    isVerified: true,
    status: "approved",
    followersCount: 96000,
    totalListeners: 70000,
    totalStreams: 900000,
  },
  {
    id: "artist-5",
    userId: "artist-user-5",
    stageName: "حسین طاهری",
    bio: "مداح اهل بیت و خواننده مولودی‌های استودیویی؛ از جمله «خانه ما نجف».",
    isVerified: true,
    status: "approved",
    followersCount: 185000,
    totalListeners: 130000,
    totalStreams: 2100000,
  },
  {
    id: "artist-6",
    userId: "artist-user-6",
    stageName: "محسن محمدی‌پناه",
    bio: "مداح هیئت انصار الولایه یزد؛ خواننده نماهنگ حماسی «باید برخاست».",
    isVerified: true,
    status: "approved",
    followersCount: 72000,
    totalListeners: 54000,
    totalStreams: 640000,
  },
];

export const mockTracks: Track[] = [
  {
    id: "track-1",
    title: "ایران من",
    artistId: "artist-2",
    artistName: "همایون شجریان",
    albumId: "album-1",
    albumName: "ایران من",
    coverUrl: COVER_IRANE_MAN,
    audioUrl: audioFor("track-1", 1),
    duration: 405,
    lyrics: "به نام آنکه هستی نام از او یافت...",
    genre: "سنتی",
    releaseYear: 2019,
    listenersCount: 720000,
    streamsCount: 4200000,
    publishedAt: "2019-05-10T00:00:00Z",
  },
  {
    id: "track-2",
    title: "خوب شد",
    artistId: "artist-2",
    artistName: "همایون شجریان",
    albumId: "album-1",
    albumName: "ایران من",
    coverUrl: COVER_IRANE_MAN,
    audioUrl: audioFor("track-2", 2),
    duration: 274,
    genre: "سنتی",
    releaseYear: 2019,
    listenersCount: 510000,
    streamsCount: 2800000,
    publishedAt: "2019-05-10T00:00:00Z",
  },
  {
    id: "track-3",
    title: "چرا رفتی",
    artistId: "artist-2",
    artistName: "همایون شجریان",
    albumId: "album-2",
    albumName: "نه فرشته‌ام نه شیطان",
    coverUrl: COVER_NA_FERESHTEH,
    audioUrl: audioFor("track-3", 3),
    duration: 317,
    lyrics: "چرا رفتی، چرا؟ من بی‌قرارم...",
    genre: "سنتی",
    releaseYear: 2013,
    listenersCount: 640000,
    streamsCount: 3600000,
    publishedAt: "2013-09-01T00:00:00Z",
  },
  {
    id: "track-4",
    title: "کولی",
    artistId: "artist-2",
    artistName: "همایون شجریان",
    albumId: "album-2",
    albumName: "نه فرشته‌ام نه شیطان",
    coverUrl: COVER_NA_FERESHTEH,
    audioUrl: audioFor("track-4", 4),
    duration: 315,
    genre: "سنتی",
    releaseYear: 2013,
    listenersCount: 380000,
    streamsCount: 1900000,
    publishedAt: "2013-09-01T00:00:00Z",
  },
  {
    id: "track-5",
    title: "الصبوح الصبوح",
    artistId: "artist-1",
    artistName: "حسن عطایی",
    albumId: null,
    albumName: null,
    coverUrl: COVER_ALSABOOH,
    audioUrl: audioFor("track-5", 5),
    duration: 252,
    genre: "مولودی",
    releaseYear: 2025,
    listenersCount: 210000,
    streamsCount: 980000,
    publishedAt: "2025-06-14T00:00:00Z",
  },
  {
    id: "track-6",
    title: "خانه ما نجف",
    artistId: "artist-5",
    artistName: "حسین طاهری",
    albumId: null,
    albumName: null,
    coverUrl: COVER_KHANE_MA_NAJAF,
    audioUrl: audioFor("track-6", 6),
    duration: 238,
    genre: "مولودی",
    releaseYear: 2024,
    listenersCount: 160000,
    streamsCount: 700000,
    publishedAt: "2024-09-16T00:00:00Z",
  },
  {
    id: "track-7",
    title: "کریم",
    artistId: "artist-3",
    artistName: "سید رضا نریمانی",
    albumId: null,
    albumName: null,
    coverUrl: COVER_KARIM,
    audioUrl: audioFor("track-7", 7),
    duration: 264,
    genre: "مولودی",
    releaseYear: 2024,
    listenersCount: 140000,
    streamsCount: 610000,
    publishedAt: "2024-03-25T00:00:00Z",
  },
  {
    id: "track-8",
    title: "اختصاصا از نجف",
    artistId: "artist-4",
    artistName: "علی اکبر حائری",
    albumId: null,
    albumName: null,
    coverUrl: COVER_AZ_NAJAF,
    audioUrl: audioFor("track-8", 8),
    duration: 276,
    genre: "مولودی",
    releaseYear: 2025,
    listenersCount: 88000,
    streamsCount: 390000,
    publishedAt: "2025-01-13T00:00:00Z",
  },
  {
    id: "track-9",
    title: "حسین اومده",
    artistId: "artist-1",
    artistName: "حسن عطایی",
    albumId: null,
    albumName: null,
    coverUrl: COVER_HOSSEIN_OOMADE,
    audioUrl: audioFor("track-9", 9),
    duration: 246,
    genre: "مولودی",
    releaseYear: 2025,
    listenersCount: 120000,
    streamsCount: 530000,
    publishedAt: "2025-02-02T00:00:00Z",
  },
  {
    id: "track-10",
    title: "باید برخاست",
    artistId: "artist-6",
    artistName: "محسن محمدی‌پناه",
    albumId: null,
    albumName: null,
    coverUrl: COVER_BAYAD_BARKHAST,
    audioUrl: audioFor("track-10", 10),
    duration: 300,
    genre: "مذهبی",
    releaseYear: 2025,
    listenersCount: 64000,
    streamsCount: 280000,
    publishedAt: "2025-07-01T00:00:00Z",
  },
];

export const mockAlbums: Album[] = [
  {
    id: "album-1",
    title: "ایران من",
    artistId: "artist-2",
    artistName: "همایون شجریان",
    coverUrl: COVER_IRANE_MAN,
    releaseDate: "2019-05-10",
    genre: "سنتی",
    trackIds: ["track-1", "track-2"],
  },
  {
    id: "album-2",
    title: "نه فرشته‌ام نه شیطان",
    artistId: "artist-2",
    artistName: "همایون شجریان",
    coverUrl: COVER_NA_FERESHTEH,
    releaseDate: "2013-09-01",
    genre: "سنتی",
    trackIds: ["track-3", "track-4"],
  },
];

export const mockPlaylists: Playlist[] = [
  {
    id: "playlist-1",
    name: "محبوب‌ترین‌ها",
    ownerId: "user-1",
    coverUrl: COVER_PLAYLIST,
    trackIds: ["track-1", "track-5", "track-3", "track-10"],
    createdAt: "2025-10-01T00:00:00Z",
    updatedAt: "2025-12-01T00:00:00Z",
  },
  {
    id: "playlist-2",
    name: "برای مطالعه",
    ownerId: "user-1",
    coverUrl: null,
    trackIds: ["track-2"],
    createdAt: "2025-11-15T00:00:00Z",
    updatedAt: "2025-11-15T00:00:00Z",
  },
];

export const mockHomeFeed: HomeFeed = {
  recentlyPlayedPlaylists: mockPlaylists,
  latestAlbums: mockAlbums,
  popularTracks: mockTracks,
  // Newest studio release gets the gold-tier early-access slot
  earlyAccessTracks: [mockTracks[9]],
};

/** Seed notifications covering every role (filtered per role in notification-storage) */
export const mockNotifications: Notification[] = [
  // Listener
  {
    id: "notif-1",
    type: "new_release",
    title: "اثر جدید",
    message: "محسن محمدی‌پناه نماهنگ «باید برخاست» را منتشر کرد.",
    isRead: false,
    createdAt: "2025-07-02T10:00:00Z",
    link: "/artist/artist-6",
  },
  {
    id: "notif-2",
    type: "subscription_expiry",
    title: "پایان اشتراک",
    message: "اشتراک نقره‌ای شما ۵ روز دیگر منقضی می‌شود.",
    isRead: true,
    createdAt: "2025-06-18T08:00:00Z",
  },
  // Artist
  {
    id: "notif-3",
    type: "artist_approval",
    title: "تایید حساب هنرمند",
    message: "حساب هنرمندی شما توسط پشتیبان تایید شد. اکنون می‌توانید آثار خود را منتشر کنید.",
    isRead: false,
    createdAt: "2025-06-21T09:00:00Z",
    link: "/artist/dashboard",
  },
  {
    id: "notif-4",
    type: "monthly_payout",
    title: "محاسبات مالی ماهانه",
    message: "پاداش ماه گذشته شما محاسبه شد و در وضعیت «در انتظار پرداخت» قرار دارد.",
    isRead: false,
    createdAt: "2025-06-19T12:00:00Z",
    link: "/artist/dashboard",
  },
  // Support / admin
  {
    id: "notif-5",
    type: "new_ticket",
    title: "تیکت جدید",
    message: "یک تیکت پشتیبانی جدید توسط کاربران ثبت شده است.",
    isRead: false,
    createdAt: "2025-06-21T14:00:00Z",
    link: "/admin/tickets",
  },
  {
    id: "notif-6",
    type: "artist_verification_request",
    title: "درخواست احراز هویت",
    message: "هنرمند تازه ثبت‌نام‌شده‌ای در انتظار بررسی نمونه‌کارها است.",
    isRead: false,
    createdAt: "2025-06-21T08:30:00Z",
    link: "/admin/artists",
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
    maxDailyStreams: null,
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
