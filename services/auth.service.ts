import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { backendCapabilities } from "@/config/backend";
import { authMockStorage } from "@/lib/auth-mock-storage";
import { delay, shouldUseBackend } from "@/lib/service-utils";
import type { Gender, User } from "@/types";

export interface LoginResponse {
  user: User;
  token: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    if (shouldUseBackend(backendCapabilities.auth.login)) {
      return apiClient<LoginResponse>(endpoints.auth.login, {
        method: "POST",
        body: { email, password },
      });
    }

    await delay(400);
    const user = authMockStorage.validateLogin(email, password);
    if (!user) throw new Error("INVALID_CREDENTIALS");
    return { user, token: `mock-token-${user.id}` };
  },

  async registerListener(data: {
    displayName: string;
    email: string;
    password: string;
    birthDate: string;
    gender: Gender;
  }): Promise<LoginResponse> {
    if (shouldUseBackend(backendCapabilities.auth.registerListener)) {
      return apiClient<LoginResponse>(endpoints.auth.register, {
        method: "POST",
        body: data,
      });
    }

    await delay(500);
    const user = authMockStorage.registerListener(data);
    return { user, token: `mock-token-${user.id}` };
  },

  async registerArtist(data: {
    email: string;
    password: string;
    stageName: string;
    sampleWorks: string;
  }): Promise<{ message: string; status: "pending" }> {
    if (shouldUseBackend(backendCapabilities.auth.registerArtist)) {
      return apiClient(endpoints.auth.registerArtist, {
        method: "POST",
        body: data,
      });
    }

    await delay(500);
    authMockStorage.registerArtist(data);
    return { message: "pending", status: "pending" };
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    if (shouldUseBackend(backendCapabilities.auth.forgotPassword)) {
      return apiClient(endpoints.auth.forgotPassword, {
        method: "POST",
        body: { email },
      });
    }

    await delay(400);
    const exists = authMockStorage.requestPasswordReset(email);
    if (!exists) throw new Error("EMAIL_NOT_FOUND");
    return { message: "sent" };
  },

  async getMe(token: string): Promise<User> {
    if (shouldUseBackend(backendCapabilities.auth.me)) {
      return apiClient<User>(endpoints.auth.me, {
        method: "GET",
        token,
      });
    }

    await delay(200);
    const userId = token.replace("mock-token-", "");
    const stored = authMockStorage.findById(userId);
    if (!stored) throw new Error("UNAUTHORIZED");
    const { password: _password, ...user } = stored;
    void _password;
    return user;
  },

  async logout(token: string): Promise<void> {
    if (shouldUseBackend(backendCapabilities.auth.logout)) {
      await apiClient<void>(endpoints.auth.logout, {
        method: "POST",
        token,
      });
      return;
    }

    void token;
    await delay(200);
  },
};
