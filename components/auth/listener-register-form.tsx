"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PrivacyPolicyModal } from "@/components/auth/privacy-policy-modal";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select } from "@/ui/select";
import { routes } from "@/config/site";
import { parseApiError } from "@/lib/parse-api-error";
import { registerListenerSchema } from "@/schemas/auth";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth-store";
import { useTranslation } from "@/hooks/use-translation";
import type { Gender } from "@/types";

export function ListenerRegisterForm() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
    gender: "male" as Gender,
    acceptPrivacy: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = registerListenerSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("auth.registerFailed"));
      return;
    }

    setLoading(true);
    try {
      const { user, token } = await authService.registerListener({
        displayName: form.displayName,
        email: form.email,
        password: form.password,
        birthDate: form.birthDate,
        gender: form.gender,
      });
      setAuth(user, token);
      router.push(routes.home);
    } catch (err) {
      if (err instanceof Error && err.message === "EMAIL_EXISTS") {
        setError(t("auth.emailExists"));
      } else {
        setError(parseApiError(err, t("auth.registerFailed")));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="reg-display-name">{t("auth.displayName")}</Label>
          <Input
            id="reg-display-name"
            autoComplete="name"
            value={form.displayName}
            onChange={(e) =>
              setForm((f) => ({ ...f, displayName: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="reg-email">{t("common.email")}</Label>
          <Input
            id="reg-email"
            type="email"
            dir="ltr"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="reg-password">{t("common.password")}</Label>
            <Input
              id="reg-password"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="reg-confirm-password">
              {t("auth.confirmPassword")}
            </Label>
            <Input
              id="reg-confirm-password"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm((f) => ({ ...f, confirmPassword: e.target.value }))
              }
              required
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="reg-birth-date">{t("profile.birthDate")}</Label>
            <Input
              id="reg-birth-date"
              type="date"
              value={form.birthDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, birthDate: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="reg-gender">{t("profile.gender")}</Label>
            <Select
              id="reg-gender"
              value={form.gender}
              onChange={(e) =>
                setForm((f) => ({ ...f, gender: e.target.value as Gender }))
              }
            >
              <option value="male">{t("auth.male")}</option>
              <option value="female">{t("auth.female")}</option>
              <option value="other">{t("auth.other")}</option>
            </Select>
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm leading-6">
          <Checkbox
            checked={form.acceptPrivacy}
            onChange={(e) =>
              setForm((f) => ({ ...f, acceptPrivacy: e.target.checked }))
            }
            className="mt-1"
          />
          <span>
            {locale === "fa" ? (
              <>
                <button
                  type="button"
                  onClick={() => setPrivacyOpen(true)}
                  className="text-primary hover:underline"
                >
                  {t("auth.privacyPolicy")}
                </button>{" "}
                {t("auth.acceptPrivacy")}
              </>
            ) : (
              <>
                {t("auth.acceptPrivacy")}{" "}
                <button
                  type="button"
                  onClick={() => setPrivacyOpen(true)}
                  className="text-primary hover:underline"
                >
                  {t("auth.privacyPolicy")}
                </button>
              </>
            )}
          </span>
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("common.loading") : t("common.register")}
        </Button>
      </form>

      <PrivacyPolicyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </>
  );
}
