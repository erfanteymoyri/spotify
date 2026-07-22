"use client";

import { useState } from "react";
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog";
import { ProfileView } from "@/components/profile/profile-view";
import { useAuth } from "@/contexts/auth-context";

export default function ProfilePage() {
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <ProfileView user={user} isOwn onEdit={() => setEditOpen(true)} />
      <EditProfileDialog open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}
