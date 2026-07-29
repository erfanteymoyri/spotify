import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { Gender, User, UserSettings } from "@/types";

export interface UpdateProfilePayload {
  displayName?: string;
  birthDate?: string;
  gender?: Gender;
}

export interface FollowResult {
  isFollowing: boolean;
  /** The viewer, with a refreshed followingCount */
  currentUser: User;
  /** The followed user, with a refreshed followersCount */
  target: User;
}

export const userService = {
  getUserById(id: string): Promise<User> {
    return apiClient<User>(endpoints.users.byId(id), { method: "GET" });
  },

  updateProfile(payload: UpdateProfilePayload): Promise<User> {
    return apiClient<User>(endpoints.users.me, {
      method: "PATCH",
      body: payload,
    });
  },

  /**
   * Multipart, so it cannot go through the JSON path. The server rejects this
   * for free-tier accounts (table 1).
   */
  uploadAvatar(file: File): Promise<User> {
    const form = new FormData();
    form.append("avatar", file);
    return apiClient<User>(endpoints.users.avatar, {
      method: "POST",
      body: form,
    });
  },

  removeAvatar(): Promise<User> {
    return apiClient<User>(endpoints.users.avatar, { method: "DELETE" });
  },

  async deleteAccount(): Promise<void> {
    await apiClient<void>(endpoints.users.me, { method: "DELETE" });
  },

  setFollowing(targetId: string, follow: boolean): Promise<FollowResult> {
    return apiClient<FollowResult>(endpoints.users.follow(targetId), {
      method: follow ? "POST" : "DELETE",
    });
  },
};

export const settingsService = {
  getSettings(): Promise<UserSettings> {
    return apiClient<UserSettings>(endpoints.settings.root, { method: "GET" });
  },

  updateSettings(data: Partial<UserSettings>): Promise<UserSettings> {
    return apiClient<UserSettings>(endpoints.settings.root, {
      method: "PATCH",
      body: data,
    });
  },
};
