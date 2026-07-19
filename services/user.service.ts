import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { backendCapabilities } from "@/config/backend";
import { authMockStorage } from "@/lib/auth-mock-storage";
import { followStorage } from "@/lib/follow-storage";
import { delay, shouldUseBackend } from "@/lib/service-utils";
import type { Gender, User } from "@/types";

export interface UpdateProfilePayload {
  displayName?: string;
  birthDate?: string;
  gender?: Gender;
  /** Data URL in mock mode; uploaded separately via multipart in phase 2 */
  avatarUrl?: string | null;
}

export interface FollowResult {
  isFollowing: boolean;
  /** Current user with the refreshed followingCount */
  currentUser: User;
  /** Target user with the refreshed followersCount */
  target: User;
}

export const userService = {
  /** GET /users/:id — public user profile */
  async getUserById(id: string): Promise<User> {
    if (shouldUseBackend(backendCapabilities.users.profile)) {
      return apiClient<User>(endpoints.users.byId(id), { method: "GET" });
    }

    await delay(200);
    const user = authMockStorage.getPublicById(id);
    if (!user) throw new Error("USER_NOT_FOUND");
    return user;
  },

  /** PATCH /users/me — edit profile fields (avatar restricted for free tier) */
  async updateProfile(
    userId: string,
    payload: UpdateProfilePayload,
  ): Promise<User> {
    if (shouldUseBackend(backendCapabilities.users.profile)) {
      return apiClient<User>(endpoints.users.updateMe, {
        method: "PATCH",
        body: payload,
      });
    }

    await delay(300);
    return authMockStorage.updateUser(userId, payload);
  },

  async isFollowing(currentUserId: string, targetId: string): Promise<boolean> {
    await delay(100);
    return followStorage.isFollowing(currentUserId, targetId);
  },

  /** POST|DELETE /users/:id/follow — returns both users with updated counts */
  async setFollowing(
    currentUserId: string,
    targetId: string,
    follow: boolean,
  ): Promise<FollowResult> {
    if (shouldUseBackend(backendCapabilities.users.follow)) {
      return apiClient<FollowResult>(endpoints.users.follow(targetId), {
        method: follow ? "POST" : "DELETE",
      });
    }

    await delay(250);
    const current = authMockStorage.findById(currentUserId);
    const target = authMockStorage.findById(targetId);
    if (!current || !target) throw new Error("USER_NOT_FOUND");

    // Only shift counts when the stored relation actually changed
    const changed = followStorage.set(currentUserId, targetId, follow);
    const delta = changed ? (follow ? 1 : -1) : 0;

    const currentUser = authMockStorage.updateUser(currentUserId, {
      followingCount: Math.max(0, current.followingCount + delta),
    });
    const targetUser = authMockStorage.updateUser(targetId, {
      followersCount: Math.max(0, target.followersCount + delta),
    });

    return { isFollowing: follow, currentUser, target: targetUser };
  },
};
