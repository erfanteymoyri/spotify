"use client";

import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterTabs } from "@/components/auth/register-tabs";
import { routes } from "@/config/site";
import { useTranslation } from "@/hooks/use-translation";

export default function RegisterPage() {
  const { t } = useTranslation();

  return (
    <AuthCard title={t("app.name")} subtitle={t("common.register")}>
      <RegisterTabs />
      <p className="text-center text-sm">
        {t("auth.hasAccount")}{" "}
        <Link href={routes.login} className="text-primary hover:underline">
          {t("common.login")}
        </Link>
      </p>
    </AuthCard>
  );
}
