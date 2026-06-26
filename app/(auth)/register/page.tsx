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

type Tab = "listener" | "artist";

export default function RegisterPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [tab, setTab] = useState<Tab>("listener");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [listenerForm, setListenerForm] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
    gender: "male" as const,
    acceptPrivacy: false,
  });

  const [artistForm, setArtistForm] = useState({
    email: "",
    password: "",
    stageName: "",
    sampleWorks: "",
  });

  const handleListenerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (listenerForm.password !== listenerForm.confirmPassword) return;
    if (!listenerForm.acceptPrivacy) return;

    setLoading(true);
    try {
      const { user, token } = await authService.registerListener({
        displayName: listenerForm.displayName,
        email: listenerForm.email,
        password: listenerForm.password,
        birthDate: listenerForm.birthDate,
        gender: listenerForm.gender,
      });
      setAuth(user, token);
      router.push(routes.home);
    } finally {
      setLoading(false);
    }
  };

  const handleArtistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.registerArtist(artistForm);
      setMessage(t("auth.artistRequestPending"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6 rounded-2xl bg-card/60 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">{t("app.name")}</h1>
          <p className="mt-2 text-muted-foreground">{t("common.register")}</p>
        </div>

        <div className="flex rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => setTab("listener")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              tab === "listener" ? "bg-background shadow" : ""
            }`}
          >
            {t("auth.listener")}
          </button>
          <button
            type="button"
            onClick={() => setTab("artist")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              tab === "artist" ? "bg-background shadow" : ""
            }`}
          >
            {t("auth.artist")}
          </button>
        </div>

        {tab === "listener" ? (
          <form onSubmit={handleListenerSubmit} className="space-y-4">
            <Input
              placeholder={t("auth.displayName")}
              value={listenerForm.displayName}
              onChange={(e) =>
                setListenerForm((f) => ({ ...f, displayName: e.target.value }))
              }
              required
            />
            <Input
              type="email"
              placeholder={t("common.email")}
              value={listenerForm.email}
              onChange={(e) =>
                setListenerForm((f) => ({ ...f, email: e.target.value }))
              }
              required
            />
            <Input
              type="password"
              placeholder={t("common.password")}
              value={listenerForm.password}
              onChange={(e) =>
                setListenerForm((f) => ({ ...f, password: e.target.value }))
              }
              required
            />
            <Input
              type="password"
              placeholder={t("auth.confirmPassword")}
              value={listenerForm.confirmPassword}
              onChange={(e) =>
                setListenerForm((f) => ({
                  ...f,
                  confirmPassword: e.target.value,
                }))
              }
              required
            />
            <Input
              type="date"
              value={listenerForm.birthDate}
              onChange={(e) =>
                setListenerForm((f) => ({ ...f, birthDate: e.target.value }))
              }
              required
            />
            <select
              value={listenerForm.gender}
              onChange={(e) =>
                setListenerForm((f) => ({
                  ...f,
                  gender: e.target.value as "male",
                }))
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
                checked={listenerForm.acceptPrivacy}
                onChange={(e) =>
                  setListenerForm((f) => ({
                    ...f,
                    acceptPrivacy: e.target.checked,
                  }))
                }
                className="mt-1 accent-primary"
              />
              <span>
                {locale === "fa" ? (
                  <>
                    <Link href="#" className="text-primary hover:underline">
                      {t("auth.privacyPolicy")}
                    </Link>{" "}
                    {t("auth.acceptPrivacy")}
                  </>
                ) : (
                  <>
                    {t("auth.acceptPrivacy")}{" "}
                    <Link href="#" className="text-primary hover:underline">
                      {t("auth.privacyPolicy")}
                    </Link>
                  </>
                )}
              </span>
            </label>
            <Button type="submit" className="w-full" disabled={loading}>
              {t("common.register")}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleArtistSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder={t("common.email")}
              value={artistForm.email}
              onChange={(e) =>
                setArtistForm((f) => ({ ...f, email: e.target.value }))
              }
              required
            />
            <Input
              type="password"
              placeholder={t("common.password")}
              value={artistForm.password}
              onChange={(e) =>
                setArtistForm((f) => ({ ...f, password: e.target.value }))
              }
              required
            />
            <Input
              placeholder={t("auth.stageName")}
              value={artistForm.stageName}
              onChange={(e) =>
                setArtistForm((f) => ({ ...f, stageName: e.target.value }))
              }
              required
            />
            <textarea
              placeholder={t("auth.sampleWorks")}
              value={artistForm.sampleWorks}
              onChange={(e) =>
                setArtistForm((f) => ({ ...f, sampleWorks: e.target.value }))
              }
              required
              className="min-h-24 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm"
            />
            {message && (
              <p className="text-sm text-primary">{message}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {t("auth.submitRequest")}
            </Button>
          </form>
        )}

        <p className="text-center text-sm">
          {t("auth.hasAccount")}{" "}
          <Link href={routes.login} className="text-primary hover:underline">
            {t("common.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
