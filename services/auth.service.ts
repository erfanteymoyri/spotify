import { mockCurrentUser } from "@/lib/mock-data";
import type { User } from "@/types";

export interface LoginResponse {
  user: User;
  token: string;
}

export const authService = {
  /**
   * POST /auth/login
   * Body: { email: string, password: string }
   * Response: { user: User, token: string }
   * Redirect based on user.role:
   *   listener/artist → /
   *   support/admin → /admin
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    // ── Real API (remove MOCK and enable when backend is ready) ──
    // return apiClient<LoginResponse>(endpoints.auth.login, {
    //   method: "POST",
    //   body: { email, password },
    // });

    // ── MOCK ──
    void email;
    void password;
    await delay(400);
    return {
      user: mockCurrentUser,
      token: "mock-jwt-token",
    };
  },

  /**
   * POST /auth/register
   * Body: RegisterListenerInput
   * Response: { user: User, token: string }
   */
  async registerListener(data: {
    displayName: string;
    email: string;
    password: string;
    birthDate: string;
    gender: string;
  }): Promise<LoginResponse> {
    // return apiClient<LoginResponse>(endpoints.auth.register, {
    //   method: "POST",
    //   body: data,
    // });

    void data;
    await delay(500);
    return {
      user: { ...mockCurrentUser, displayName: data.displayName, email: data.email },
      token: "mock-jwt-token",
    };
  },

  /**
   * POST /auth/register/artist
   * Body: { email, password, stageName, sampleWorks }
   * Response: { message: string, status: "pending" }
   */
  async registerArtist(data: {
    email: string;
    password: string;
    stageName: string;
    sampleWorks: string;
  }): Promise<{ message: string; status: "pending" }> {
    // return apiClient(endpoints.auth.registerArtist, {
    //   method: "POST",
    //   body: data,
    // });

    void data;
    await delay(500);
    return {
      message: "Your request has been submitted and is pending approval.",
      status: "pending",
    };
  },

  /**
   * GET /auth/me
   * Header: Authorization: Bearer {token}
   */
  async getMe(token: string): Promise<User> {
    // return apiClient<User>(endpoints.auth.me, {
    //   method: "GET",
    //   token,
    // });

    void token;
    await delay(200);
    return mockCurrentUser;
  },

  /**
   * POST /auth/logout
   */
  async logout(token: string): Promise<void> {
    // return apiClient<void>(endpoints.auth.logout, {
    //   method: "POST",
    //   token,
    // });

    void token;
    await delay(200);
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
