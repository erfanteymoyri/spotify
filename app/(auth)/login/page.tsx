"use client";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { useTranslation } from "@/hooks/use-translation";

export default function LoginPage() {
  const { t } = useTranslation();

  return (
    <AuthCard title={t("app.name")} subtitle={t("auth.loginTitle")}>
      <LoginForm />
    </AuthCard>
  );
}
