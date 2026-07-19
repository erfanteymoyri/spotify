import { readJson, writeJson } from "@/lib/local-store";

const FOLLOWS_KEY = "spotify-follows";

/** followerId -> ids of the users they follow */
type FollowMap = Record<string, string[]>;

export const followStorage = {
  isFollowing(followerId: string, targetId: string): boolean {
    const map = readJson<FollowMap>(FOLLOWS_KEY, {});
    return map[followerId]?.includes(targetId) ?? false;
  },

  /**
   * Set the follow relation explicitly.
   * Returns true when the stored state actually changed.
   */
  set(followerId: string, targetId: string, follow: boolean): boolean {
    const map = readJson<FollowMap>(FOLLOWS_KEY, {});
    const list = map[followerId] ?? [];
    const alreadyFollowing = list.includes(targetId);
    if (alreadyFollowing === follow) return false;

    map[followerId] = follow
      ? [...list, targetId]
      : list.filter((id) => id !== targetId);
    writeJson(FOLLOWS_KEY, map);
    return true;
  },
};
