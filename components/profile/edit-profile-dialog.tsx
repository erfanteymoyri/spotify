"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/ui/avatar";
import { Button } from "@/ui/button";
import { Dialog } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select } from "@/ui/select";
import { subscriptionLimits } from "@/config/subscription";
import { useTranslation } from "@/hooks/use-translation";
import { parseApiError } from "@/lib/parse-api-error";
import { updateProfileSchema } from "@/schemas/profile";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/stores/auth-store";
import type { Gender, User } from "@/types";

/** Keeps mock avatars (data URLs) safely inside the Local Storage quota */
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

export function EditProfileDialog({ open, onClose }: EditProfileDialogProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("profile.editProfile")}
      closeLabel={t("common.close")}
    >
      {/* Mounting the form only while open re-seeds it from the user each time */}
      {open && <EditProfileForm user={user} onClose={onClose} />}
    </Dialog>
  );
}

function EditProfileForm({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const updateUser = useAuthStore((s) => s.updateUser);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl);
  const [form, setForm] = useState({
    displayName: user.displayName,
    birthDate: user.birthDate ?? "",
    gender: (user.gender ?? "") as Gender | "",
  });

  const canUploadAvatar = subscriptionLimits[user.subscription].canUploadAvatar;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t("profile.avatarInvalidType"));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError(t("profile.avatarTooLarge"));
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = updateProfileSchema.safeParse({
      displayName: form.displayName,
      birthDate: form.birthDate || undefined,
      gender: form.gender || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("profile.updateFailed"));
      return;
    }

    setLoading(true);
    try {
      const updated = await userService.updateProfile(user.id, {
        ...parsed.data,
        // Avatar changes are restricted to silver/gold tiers (spec 2.3)
        ...(canUploadAvatar ? { avatarUrl } : {}),
      });
      updateUser(updated);
      onClose();
    } catch (err) {
      setError(parseApiError(err, t("profile.updateFailed")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col items-center gap-3">
        <Avatar
          src={avatarUrl}
          alt={form.displayName || user.displayName}
          size="lg"
          className="size-24"
        />
        {canUploadAvatar ? (
          <div className="flex flex-wrap justify-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              {t("profile.changeAvatar")}
            </Button>
            {avatarUrl && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setAvatarUrl(null)}
              >
                {t("profile.removeAvatar")}
              </Button>
            )}
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            {t("profile.avatarUpgradeHint")}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="edit-display-name">{t("auth.displayName")}</Label>
        <Input
          id="edit-display-name"
          value={form.displayName}
          onChange={(e) =>
            setForm((f) => ({ ...f, displayName: e.target.value }))
          }
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="edit-birth-date">{t("profile.birthDate")}</Label>
          <Input
            id="edit-birth-date"
            type="date"
            value={form.birthDate}
            onChange={(e) =>
              setForm((f) => ({ ...f, birthDate: e.target.value }))
            }
          />
        </div>
        <div>
          <Label htmlFor="edit-gender">{t("profile.gender")}</Label>
          <Select
            id="edit-gender"
            value={form.gender}
            onChange={(e) =>
              setForm((f) => ({ ...f, gender: e.target.value as Gender | "" }))
            }
          >
            <option value="">{t("common.empty")}</option>
            <option value="male">{t("auth.male")}</option>
            <option value="female">{t("auth.female")}</option>
            <option value="other">{t("auth.other")}</option>
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? t("common.saving") : t("common.save")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onClose}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
