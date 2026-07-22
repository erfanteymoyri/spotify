"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProfileView } from "@/components/profile/profile-view";
import { EmptyState } from "@/components/shared/empty-state";
import { routes } from "@/config/site";
import { useTranslation } from "@/hooks/use-translation";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/stores/auth-store";
import type { User } from "@/types";

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [profile, setProfile] = useState<User | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = Boolean(id && currentUserId === id);

  // Own profile lives at /profile where editing is available
  useEffect(() => {
    if (isOwnProfile) router.replace(routes.profile);
  }, [isOwnProfile, router]);

  useEffect(() => {
    if (!id || isOwnProfile) return;
    userService
      .getUserById(id)
      .then(setProfile)
      .catch(() => setNotFound(true));
  }, [id, isOwnProfile]);

  useEffect(() => {
    if (!id || !currentUserId || isOwnProfile) return;
    userService.isFollowing(currentUserId, id).then(setIsFollowing);
  }, [id, currentUserId, isOwnProfile]);

  const handleToggleFollow = async () => {
    if (!currentUserId || !profile || followLoading) return;
    setFollowLoading(true);
    try {
      const result = await userService.setFollowing(
        currentUserId,
        profile.id,
        !isFollowing,
      );
      setIsFollowing(result.isFollowing);
      setProfile(result.target);
      updateUser(result.currentUser);
    } finally {
      setFollowLoading(false);
    }
  };

  if (notFound) {
    return (
      <div className="py-10">
        <EmptyState title={t("errors.userNotFound")} />
      </div>
    );
  }

  if (!profile || isOwnProfile) {
    return (
      <p className="py-20 text-center text-muted-foreground">
        {t("common.loading")}
      </p>
    );
  }

  return (
    <ProfileView
      user={profile}
      isOwn={false}
      isFollowing={isFollowing}
      followLoading={followLoading}
      onToggleFollow={handleToggleFollow}
    />
  );
}
