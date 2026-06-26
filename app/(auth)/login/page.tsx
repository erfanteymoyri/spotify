"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { routes } from "@/config/site";
import { useTranslation } from "@/hooks/use-translation";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { user, token } = await authService.login(email, password);
      setAuth(user, token);
      const dest =
        user.role === "admin" || user.role === "support"
          ? routes.adminDashboard
          : routes.home;
      router.push(dest);
    } catch {
      setError(t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-card/60 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">{t("app.name")}</h1>
          <p className="mt-2 text-muted-foreground">{t("auth.loginTitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm">{t("common.email")}</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm">{t("common.password")}</label>
            <Input
              type="password"
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
            className="text-muted-foreground hover:text-primary"
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
      </div>
    </div>
  );
}
