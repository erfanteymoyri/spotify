"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { routes } from "@/config/site";
import { getAuthRedirectPath } from "@/lib/auth-redirect";
import { parseApiError } from "@/lib/parse-api-error";
import { loginSchema } from "@/schemas/auth";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth-store";
import { useTranslation } from "@/hooks/use-translation";

export function LoginForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("auth.loginFailed"));
      return;
    }

    setLoading(true);
    try {
      const { user, token } = await authService.login(email, password);
      setAuth(user, token);
      router.push(getAuthRedirectPath(user.role));
    } catch (err) {
      if (err instanceof Error && err.message === "INVALID_CREDENTIALS") {
        setError(t("auth.loginFailed"));
      } else {
        setError(parseApiError(err, t("auth.loginFailed")));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-sm">
            {t("common.email")}
          </label>
          <Input
            id="login-email"
            type="email"
            dir="ltr"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="login-password" className="mb-1.5 block text-sm">
            {t("common.password")}
          </label>
          <Input
            id="login-password"
            type="password"
            dir="ltr"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("common.loading") : t("common.login")}
        </Button>
      </form>

      <div className="space-y-2 text-center text-sm">
        <Link
          href={routes.forgotPassword}
          className="block text-muted-foreground transition-colors hover:text-primary"
        >
          {t("auth.forgotPassword")}
        </Link>
        <p>
          {t("auth.noAccount")}{" "}
          <Link href={routes.register} className="text-primary hover:underline">
            {t("common.register")}
          </Link>
        </p>
      </div>
    </>
  );
}
