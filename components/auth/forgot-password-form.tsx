"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { routes } from "@/config/site";
import { parseApiError } from "@/lib/parse-api-error";
import { forgotPasswordSchema } from "@/schemas/auth";
import { authService } from "@/services/auth.service";
import { useTranslation } from "@/hooks/use-translation";

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("auth.resetFailed"));
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      if (err instanceof Error && err.message === "EMAIL_NOT_FOUND") {
        setError(t("auth.emailNotFound"));
      } else {
        setError(parseApiError(err, t("auth.resetFailed")));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">{t("auth.resetEmailSent")}</p>
        <Button asChild variant="outline" className="w-full">
          <Link href={routes.login}>{t("auth.backToLogin")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reset-email" className="mb-1.5 block text-sm">
            {t("common.email")}
          </label>
          <Input
            id="reset-email"
            type="email"
            dir="ltr"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {t("auth.forgotPasswordHint")}
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("common.loading") : t("auth.sendResetLink")}
        </Button>
      </form>

      <div className="text-center text-sm">
        <Link href={routes.login} className="text-primary hover:underline">
          {t("auth.backToLogin")}
        </Link>
      </div>
    </>
  );
}
