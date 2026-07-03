"use client";

import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { useTranslation } from "@/hooks/use-translation";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();

  return (
    <AuthCard title={t("app.name")} subtitle={t("auth.forgotPassword")}>
      <ForgotPasswordForm />
    </AuthCard>
  );
}
