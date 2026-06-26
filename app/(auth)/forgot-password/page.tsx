"use client";

import Link from "next/link";
import { routes } from "@/config/site";
import { Button } from "@/ui/button";
import { useTranslation } from "@/hooks/use-translation";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-card/60 p-8 text-center">
        <h1 className="text-2xl font-bold">{t("app.name")}</h1>
        <p className="text-muted-foreground">{t("auth.forgotPasswordHint")}</p>
        <Button asChild variant="outline">
          <Link href={routes.login}>{t("auth.backToLogin")}</Link>
        </Button>
      </div>
    </div>
  );
}
