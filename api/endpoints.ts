/**
 * =============================================================================
 * Backend API endpoint map
 * =============================================================================
 * All paths are relative to NEXT_PUBLIC_API_URL (default http://localhost:8000/api)
 * and mirror the Django routes one-for-one. The live, authoritative contract is
 * the OpenAPI document the backend serves at /api/docs.
 * =============================================================================
 */

export const endpoints = {
  // --- Authentication ---
  auth: {
    /** POST — shared sign-in for all four roles */
    login: "/auth/login",
    /** POST — listener registration; returns { user, token } */
    register: "/auth/register",
    /** POST — artist application; lands in `pending` */
    registerArtist: "/auth/register/artist",
    /** POST — request a password-reset email */
    forgotPassword: "/auth/forgot-password",
    /** POST — { uid, token, password } */
    resetPassword: "/auth/reset-password",
    /** POST — blacklists the refresh token */
    logout: "/auth/logout",
    /** GET — the current user, resolved from the bearer token */
    me: "/auth/me",
  },

  // --- Users ---
  users: {
    /** GET — public profile (no email) */
    byId: (id: string) => `/users/${id}`,
    /** GET | PATCH | DELETE — my own account */
    me: "/users/me",
    /** POST (multipart) | DELETE — my avatar; paid tiers only */
    avatar: "/users/me/avatar",
    /** POST to follow, DELETE to unfollow */
    follow: (id: string) => `/users/${id}/follow`,
  },

  // --- Home feed ---
  home: {
    /** GET — recently played playlists, latest albums, popular + early-access tracks */
    feed: "/home",
  },

  // --- Catalogue ---
  tracks: {
    /** GET — ?q=&type=track|artist&sort=listeners|date&page=&pageSize= */
    list: "/tracks",
    byId: (id: string) => `/tracks/${id}`,
    /** POST — { secondsPlayed }; enforces the daily quota */
    stream: (id: string) => `/tracks/${id}/stream`,
  },

  albums: {
    list: "/albums",
    /** GET — album with its full track list */
    byId: (id: string) => `/albums/${id}`,
  },

  artists: {
    /** GET — profile + albums + singles + isFollowing */
    byId: (id: string) => `/artists/${id}`,
    /** GET — aggregate stats; gold tier only */
    stats: (id: string) => `/artists/${id}/stats`,
    /** POST to follow, DELETE to unfollow */
    follow: (id: string) => `/artists/${id}/follow`,
  },

  me: {
    /** GET — deduplicated recent plays, newest first */
    recentlyPlayed: "/me/recently-played",
  },

  // --- Playlists ---
  playlists: {
    /** GET my playlists | POST { name } (tier quota enforced) */
    root: "/playlists",
    /** GET details | PATCH { name } | DELETE */
    byId: (id: string) => `/playlists/${id}`,
    /** POST { trackId } */
    tracks: (id: string) => `/playlists/${id}/tracks`,
    /** DELETE */
    track: (playlistId: string, trackId: string) =>
      `/playlists/${playlistId}/tracks/${trackId}`,
  },

  // --- Notifications ---
  notifications: {
    /** GET — ?unread=true */
    list: "/notifications",
    markRead: (id: string) => `/notifications/${id}/read`,
    delete: (id: string) => `/notifications/${id}`,
    readAll: "/notifications/read-all",
    unreadCount: "/notifications/unread-count",
  },

  // --- Settings (server-side, synced across devices) ---
  settings: {
    /** GET | PATCH — { notificationsEnabled, volume, language } */
    root: "/settings",
  },

  // --- Subscriptions & payment ---
  subscriptions: {
    /** GET — prices and limits for every tier */
    plans: "/subscriptions/plans",
    /** GET — the 1/3/6/12-month ladder with each duration's discount and totals */
    billingOptions: "/subscriptions/billing-options",
    /** GET — my tier, plan and active subscription */
    me: "/subscriptions/me",
    history: "/subscriptions/history",
    /** POST { tier, durationMonths } — returns { payment, paymentUrl } */
    checkout: "/subscriptions/checkout",
  },

  payments: {
    list: "/payments",
    /** GET — poll after returning from the gateway */
    byId: (id: string) => `/payments/${id}`,
  },

  // --- Support tickets ---
  tickets: {
    /** GET my tickets | POST { subject, message } */
    root: "/tickets",
    byId: (id: string) => `/tickets/${id}`,
    /** POST { content } */
    messages: (id: string) => `/tickets/${id}/messages`,
  },

  // --- Artist studio ---
  artist: {
    /** GET — my published works, with per-work revenue */
    works: "/artist/works",
    /** POST (multipart: audio, cover, metadata) */
    tracks: "/artist/tracks",
    /** PATCH | DELETE */
    trackById: (id: string) => `/artist/tracks/${id}`,
    /** GET — lifetime studio totals */
    analytics: "/artist/analytics",
    /** GET — my monthly payout statements */
    payouts: "/artist/payouts",

    /** GET my albums with their tracklists | POST (multipart) to create one */
    albums: "/artist/albums",
    /** GET | PATCH (multipart) | DELETE — deleting keeps the tracks as singles */
    albumById: (id: string) => `/artist/albums/${id}`,
    /** POST { trackId } — move one of my tracks into this album */
    albumTracks: (id: string) => `/artist/albums/${id}/tracks`,
    /** DELETE — detach a track; it becomes a single again */
    albumTrack: (albumId: string, trackId: string) =>
      `/artist/albums/${albumId}/tracks/${trackId}`,
    /** PATCH { trackIds } — the album's running order */
    albumOrder: (id: string) => `/artist/albums/${id}/order`,
  },

  // --- Back office (support / admin) ---
  admin: {
    /** GET — ?status=pending|approved|rejected|all */
    artistRequests: "/admin/artist-requests",
    /** PATCH — { action: approve|reject, reason? } */
    reviewArtist: (id: string) => `/admin/artist-requests/${id}`,
    /** GET — every ticket */
    tickets: "/admin/tickets",
    ticketById: (id: string) => `/admin/tickets/${id}`,
    /** POST { content } — reply as support */
    ticketReply: (id: string) => `/admin/tickets/${id}/messages`,
    /** PATCH { status } */
    ticketStatus: (id: string) => `/admin/tickets/${id}`,
    /** GET — ?month=YYYY-MM; monthly artist payout table */
    accounting: "/admin/accounting",
    /** PATCH — confirm a settlement (admin only) */
    settlePayment: (id: string) => `/admin/accounting/${id}/settle`,
    /** GET | PATCH — { silver, gold } */
    pricing: "/admin/pricing",
    /** GET — tier distribution + monthly revenue (admin only) */
    stats: "/admin/stats",
  },
} as const;
