import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { ArtistStatus, Gender, User } from "@/types";

export interface LoginResponse {
  user: User;
  token: string;
  /** Long-lived token, sent back on sign-out so the server can revoke it. */
  refresh: string;
}

export const authService = {
  login(email: string, password: string): Promise<LoginResponse> {
    return apiClient<LoginResponse>(endpoints.auth.login, {
      method: "POST",
      anonymous: true,
      body: { email, password },
    });
  },

  registerListener(data: {
    displayName: string;
    email: string;
    password: string;
    birthDate: string;
    gender: Gender;
  }): Promise<LoginResponse> {
    return apiClient<LoginResponse>(endpoints.auth.register, {
      method: "POST",
      anonymous: true,
      body: data,
    });
  },

  /**
   * Artist sign-up returns no token: the account sits in `pending` until
   * support reviews it, so there is nothing to sign in to yet.
   */
  registerArtist(data: {
    email: string;
    password: string;
    stageName: string;
    sampleWorks: string;
  }): Promise<{ message: string; status: ArtistStatus }> {
    return apiClient(endpoints.auth.registerArtist, {
      method: "POST",
      anonymous: true,
      body: data,
    });
  },

  forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient(endpoints.auth.forgotPassword, {
      method: "POST",
      anonymous: true,
      body: { email },
    });
  },

  resetPassword(data: {
    uid: string;
    token: string;
    password: string;
  }): Promise<{ message: string }> {
    return apiClient(endpoints.auth.resetPassword, {
      method: "POST",
      anonymous: true,
      body: data,
    });
  },

  getMe(token?: string): Promise<User> {
    return apiClient<User>(endpoints.auth.me, { method: "GET", token });
  },

  async logout(refresh?: string | null): Promise<void> {
    await apiClient<void>(endpoints.auth.logout, {
      method: "POST",
      body: refresh ? { refresh } : {},
    });
  },
};
