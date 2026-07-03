export const backendCapabilities = {
  auth: {
    login: true,
    registerListener: true,
    registerArtist: false,
    forgotPassword: false,
    me: false,
    logout: false,
  },
  home: {
    feed: false,
  },
} as const;
