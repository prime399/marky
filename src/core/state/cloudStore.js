import { create } from "zustand";

const DEFAULT_AUTH_STATE = {
  authenticated: false,
  user: null,
  subscribed: false,
  proSubscription: null,
  cached: false,
};

export const useCloudStore = create((set) => ({
  auth: DEFAULT_AUTH_STATE,
  authLastCheckedAt: null,
  authError: null,
  setAuthState: (auth) =>
    set(() => ({
      auth: {
        ...DEFAULT_AUTH_STATE,
        ...(auth || {}),
      },
      authError: null,
      authLastCheckedAt: Date.now(),
    })),
  setAuthError: (error) =>
    set(() => ({
      authError: error?.message || String(error || "Unknown auth error"),
      authLastCheckedAt: Date.now(),
    })),
  resetAuthState: () =>
    set(() => ({
      auth: DEFAULT_AUTH_STATE,
      authError: null,
      authLastCheckedAt: Date.now(),
    })),
}));
