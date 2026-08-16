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

  /**
   * Step 1 of password recovery: email a short code to the address.
   *
   * Resolves the same way whether or not the address has an account — the
   * server will not say which, so the UI must not promise that an email is
   * definitely on its way to *this* address.
   */
  forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient(endpoints.auth.forgotPassword, {
      method: "POST",
      anonymous: true,
      body: { email },
    });
  },

  /**
   * Step 2: trade the emailed code for a single-use ticket. The code is spent
   * here — a wrong one costs an attempt, and after a few the user has to ask
   * for a new code.
   */
  verifyResetCode(email: string, code: string): Promise<{ ticket: string }> {
    return apiClient(endpoints.auth.verifyResetCode, {
      method: "POST",
      anonymous: true,
      body: { email, code },
    });
  },

  /** Step 3: spend the ticket on a new password. */
  resetPassword(data: {
    email: string;
    ticket: string;
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
