/**
 * =============================================================================
 * Backend API endpoint reference — project phase 2
 * =============================================================================
 * All paths are relative to NEXT_PUBLIC_API_URL (default: http://localhost:8000/api).
 * Each section documents HTTP method, body/params, and expected response.
 * =============================================================================
 */

export const endpoints = {
  // --- Authentication ---
  auth: {
    /** POST /auth/login — shared login for all roles */
    login: "/auth/login",
    /** POST /auth/register — listener registration */
    register: "/auth/register",
    /** POST /auth/register/artist — artist registration (status: pending) */
    registerArtist: "/auth/register/artist",
    /** POST /auth/forgot-password — send recovery email */
    forgotPassword: "/auth/forgot-password",
    /** POST /auth/reset-password — set new password with token */
    resetPassword: "/auth/reset-password",
    /** POST /auth/logout — logout and invalidate token */
    logout: "/auth/logout",
    /** GET /auth/me — current user from token */
    me: "/auth/me",
  },

  // --- Users ---
  users: {
    /** GET /users/:id — public user profile */
    byId: (id: string) => `/users/${id}`,
    /** PATCH /users/me — edit profile (displayName, birthDate, gender) */
    updateMe: "/users/me",
    /** POST /users/me/avatar — upload avatar (multipart) — restricted for free tier */
    uploadAvatar: "/users/me/avatar",
    /** POST /users/:id/follow — follow user */
    follow: (id: string) => `/users/${id}/follow`,
    /** DELETE /users/:id/follow — unfollow user */
    unfollow: (id: string) => `/users/${id}/follow`,
    /** DELETE /users/me — delete account */
    deleteMe: "/users/me",
  },

  // --- Home feed ---
  home: {
    /** GET /home — recent playlists, latest albums, popular tracks */
    feed: "/home",
  },

  // --- Music ---
  tracks: {
    /** GET /tracks — list with pagination, search, sort (listeners|date) */
    list: "/tracks",
    /** GET /tracks/:id — track details */
    byId: (id: string) => `/tracks/${id}`,
    /** GET /tracks/search?q=&type=track|artist&sort=listeners|date */
    search: "/tracks/search",
    /** POST /tracks/:id/stream — record stream (daily limit + analytics) */
    stream: (id: string) => `/tracks/${id}/stream`,
  },

  albums: {
    /** GET /albums — album list */
    list: "/albums",
    /** GET /albums/:id — details + trackIds */
    byId: (id: string) => `/albums/${id}`,
  },

  artists: {
    /** GET /artists/:id — artist profile + albums + singles */
    byId: (id: string) => `/artists/${id}`,
    /** GET /artists/:id/stats — stats (gold tier + verified artist only) */
    stats: (id: string) => `/artists/${id}/stats`,
  },

  // --- Playlists ---
  playlists: {
    /** GET /playlists — current user's playlists */
    list: "/playlists",
    /** POST /playlists — create { name } — enforce tier playlist limit */
    create: "/playlists",
    /** PATCH /playlists/:id — rename playlist */
    update: (id: string) => `/playlists/${id}`,
    /** DELETE /playlists/:id */
    delete: (id: string) => `/playlists/${id}`,
    /** GET /playlists/:id — details + tracks */
    byId: (id: string) => `/playlists/${id}`,
    /** POST /playlists/:id/tracks — { trackId } */
    addTrack: (id: string) => `/playlists/${id}/tracks`,
    /** DELETE /playlists/:id/tracks/:trackId */
    removeTrack: (playlistId: string, trackId: string) =>
      `/playlists/${playlistId}/tracks/${trackId}`,
  },

  // --- Notifications ---
  notifications: {
    /** GET /notifications — list filtered by user role */
    list: "/notifications",
    /** PATCH /notifications/:id/read */
    markRead: (id: string) => `/notifications/${id}/read`,
    /** DELETE /notifications/:id */
    delete: (id: string) => `/notifications/${id}`,
    /** PATCH /notifications/read-all */
    readAll: "/notifications/read-all",
  },

  // --- Settings ---
  settings: {
    /** GET /settings — notificationsEnabled, volume, language */
    get: "/settings",
    /** PATCH /settings */
    update: "/settings",
  },

  // --- Subscriptions ---
  subscriptions: {
    /** GET /subscriptions/plans — dynamic silver/gold pricing */
    plans: "/subscriptions/plans",
    /** GET /subscriptions/me — active user subscription */
    me: "/subscriptions/me",
  },

  // --- Artist panel ---
  artist: {
    /** GET /artist/works — published works */
    works: "/artist/works",
    /** POST /artist/tracks — upload (multipart: audio, cover, metadata) */
    uploadTrack: "/artist/tracks",
    /** PATCH /artist/tracks/:id */
    updateTrack: (id: string) => `/artist/tracks/${id}`,
    /** DELETE /artist/tracks/:id */
    deleteTrack: (id: string) => `/artist/tracks/${id}`,
    /** GET /artist/analytics — detailed analytics */
    analytics: "/artist/analytics",
  },

  // --- Admin / support ---
  admin: {
    /** GET /admin/artist-requests?status=pending */
    artistRequests: "/admin/artist-requests",
    /** PATCH /admin/artist-requests/:id — { action: approve|reject, reason? } */
    reviewArtist: (id: string) => `/admin/artist-requests/${id}`,
    /** GET /admin/tickets */
    tickets: "/admin/tickets",
    /** GET /admin/tickets/:id — includes messages */
    ticketById: (id: string) => `/admin/tickets/${id}`,
    /** POST /admin/tickets/:id/messages — { content } */
    ticketReply: (id: string) => `/admin/tickets/${id}/messages`,
    /** GET /admin/accounting — monthly artist payout table */
    accounting: "/admin/accounting",
    /** PATCH /admin/accounting/:id/settle — confirm settlement */
    settlePayment: (id: string) => `/admin/accounting/${id}/settle`,
    /** GET /admin/pricing — { silver: number, gold: number } */
    pricing: "/admin/pricing",
    /** PATCH /admin/pricing — { silver, gold } */
    updatePricing: "/admin/pricing",
    /** GET /admin/stats — tier pie chart + monthly revenue */
    stats: "/admin/stats",
  },
} as const;
