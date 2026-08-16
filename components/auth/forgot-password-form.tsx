"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/api/client";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { routes } from "@/config/site";
import { parseApiError } from "@/lib/parse-api-error";
import {
  forgotPasswordSchema,
  resetCodeSchema,
  resetPasswordSchema,
} from "@/schemas/auth";
import { authService } from "@/services/auth.service";
import { useTranslation } from "@/hooks/use-translation";

/**
 * Password recovery, as one form in three steps.
 *
 * The steps share a component rather than living on three routes because the
 * email and the ticket have to survive between them, and putting either in the
 * URL would leak a live recovery secret into history, referrers and shoulder
 * range. Nothing here is bookmarkable on purpose.
 */
type Step = "email" | "code" | "password" | "done";

/** Matches the backend's `password-reset` throttle: no point in letting the
 *  user spend requests faster than the server will accept them. */
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * The failures a user actually hits are a wrong code, a ticket that timed out,
 * and the rate limit — all worth saying in their own language. So the
 * backend's stable `code` is translated here rather than falling through to
 * `parseApiError`, which would surface the server's English `detail`.
 */
const RESET_ERROR_KEYS: Record<string, string> = {
  INVALID_RESET_CODE: "auth.invalidCode",
  INVALID_RESET_TOKEN: "auth.resetExpired",
  throttled: "auth.tooManyAttempts",
};

export function ForgotPasswordForm() {
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [ticket, setTicket] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  /** Wraps a step's request: one place decides how loading and errors behave. */
  const run = async (action: () => Promise<void>, fallback: string) => {
    setError(null);
    setLoading(true);
    try {
      await action();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      const key = code ? RESET_ERROR_KEYS[code] : undefined;
      setError(key ? t(key) : parseApiError(err, fallback));

      // A dead ticket cannot be revived, so leaving the user on the password
      // form would leave them pressing a button that can only fail. Send them
      // back to the start, where requesting a fresh code is one step away.
      if (code === "INVALID_RESET_TOKEN") {
        setTicket("");
        setCode("");
        setStep("email");
      }
    } finally {
      setLoading(false);
    }
  };

  // -- step 1: the address ------------------------------------------------

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("auth.resetFailed"));
      return;
    }

    await run(async () => {
      await authService.forgotPassword(email);
      setStep("code");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    }, t("auth.resetFailed"));
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    await run(async () => {
      await authService.forgotPassword(email);
      // The previous code is dead now, so clear the field rather than leave a
      // stale one sitting there looking submittable.
      setCode("");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    }, t("auth.resetFailed"));
  };

  // -- step 2: the code ---------------------------------------------------

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = resetCodeSchema.safeParse({ code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("auth.invalidCode"));
      return;
    }

    await run(async () => {
      const { ticket: issued } = await authService.verifyResetCode(email, code);
      setTicket(issued);
      setStep("password");
    }, t("auth.invalidCode"));
  };

  // -- step 3: the new password -------------------------------------------

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("auth.resetPasswordFailed"));
      return;
    }

    await run(async () => {
      await authService.resetPassword({ email, ticket, password });
      setStep("done");
    }, t("auth.resetPasswordFailed"));
  };

  // -- rendering ----------------------------------------------------------

  const backToLogin = (
    <div className="text-center text-sm">
      <Link href={routes.login} className="text-primary hover:underline">
        {t("auth.backToLogin")}
      </Link>
    </div>
  );

  if (step === "done") {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm leading-6 text-muted-foreground">
          {t("auth.passwordResetSuccess")}
        </p>
        <Button asChild className="w-full">
          <Link href={routes.login}>{t("common.login")}</Link>
        </Button>
      </div>
    );
  }

  if (step === "code") {
    return (
      <>
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            {t("auth.codeSentHint", { email })}
          </p>
          <div>
            <label htmlFor="reset-code" className="mb-1.5 block text-sm">
              {t("auth.recoveryCode")}
            </label>
            <Input
              id="reset-code"
              dir="ltr"
              // `text` with a numeric keypad, not `number`: a code is a string
              // of digits, and `number` would bring spinners and strip a
              // leading zero.
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="------"
              className="text-center text-lg tracking-[0.5em]"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              autoFocus
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("common.loading") : t("auth.verifyCode")}
          </Button>
        </form>

        <div className="space-y-2 text-center text-sm">
          <button
            type="button"
            onClick={handleResend}
            disabled={loading || cooldown > 0}
            className="text-muted-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:text-muted-foreground"
          >
            {cooldown > 0
              ? t("auth.resendCodeIn", { seconds: cooldown })
              : t("auth.resendCode")}
          </button>
          {backToLogin}
        </div>
      </>
    );
  }

  if (step === "password") {
    return (
      <>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            {t("auth.chooseNewPasswordHint")}
          </p>
          <div>
            <label htmlFor="new-password" className="mb-1.5 block text-sm">
              {t("auth.newPassword")}
            </label>
            <Input
              id="new-password"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div>
            <label htmlFor="confirm-new-password" className="mb-1.5 block text-sm">
              {t("auth.confirmPassword")}
            </label>
            <Input
              id="confirm-new-password"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("common.loading") : t("auth.setNewPassword")}
          </Button>
        </form>

        {backToLogin}
      </>
    );
  }

  return (
    <>
      <form onSubmit={handleRequestCode} className="space-y-4">
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
          {loading ? t("common.loading") : t("auth.sendResetCode")}
        </Button>
      </form>

      {backToLogin}
    </>
  );
}
