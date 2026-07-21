export const backendCapabilities = {
  auth: {
    login: true,
    registerListener: true,
    registerArtist: false,
    forgotPassword: false,
    me: false,
    logout: false,
  },
  users: {
    profile: false,
    follow: false,
  },
  home: {
    feed: false,
  },
  artist: {
    works: false,
    upload: false,
    analytics: false,
  },
  admin: {
    tickets: false,
    artistRequests: false,
    accounting: false,
    pricing: false,
    stats: false,
  },
} as const;
