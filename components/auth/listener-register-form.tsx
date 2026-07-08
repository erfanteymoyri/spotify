"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PrivacyPolicyModal } from "@/components/auth/privacy-policy-modal";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder={t("auth.displayName")}
          value={form.displayName}
          onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
          required
        />
        <Input
          type="email"
          placeholder={t("common.email")}
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
        />
        <Input
          type="password"
          placeholder={t("common.password")}
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          required
        />
        <Input
          type="password"
          placeholder={t("auth.confirmPassword")}
          value={form.confirmPassword}
          onChange={(e) =>
            setForm((f) => ({ ...f, confirmPassword: e.target.value }))
          }
          required
        />
        <Input
          type="date"
          value={form.birthDate}
          onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
          required
        />
        <select
          value={form.gender}
          onChange={(e) =>
            setForm((f) => ({ ...f, gender: e.target.value as Gender }))
          }
          className="h-10 w-full rounded-lg border border-input bg-background/50 px-3 text-sm"
        >
          <option value="male">{t("auth.male")}</option>
          <option value="female">{t("auth.female")}</option>
          <option value="other">{t("auth.other")}</option>
        </select>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.acceptPrivacy}
            onChange={(e) =>
              setForm((f) => ({ ...f, acceptPrivacy: e.target.checked }))
            }
            className="mt-1 accent-primary"
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
