"use client";

import { useState } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { parseApiError } from "@/lib/parse-api-error";
import { registerArtistSchema } from "@/schemas/auth";
import { authService } from "@/services/auth.service";
import { useTranslation } from "@/hooks/use-translation";

export function ArtistRegisterForm() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    stageName: "",
    sampleWorks: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const parsed = registerArtistSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("auth.registerFailed"));
      return;
    }

    setLoading(true);
    try {
      await authService.registerArtist(form);
      setMessage(t("auth.artistRequestPending"));
      setForm({ email: "", password: "", stageName: "", sampleWorks: "" });
    } catch (err) {
      setError(parseApiError(err, t("auth.registerFailed")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        placeholder={t("auth.stageName")}
        value={form.stageName}
        onChange={(e) => setForm((f) => ({ ...f, stageName: e.target.value }))}
        required
      />
      <textarea
        placeholder={t("auth.sampleWorks")}
        value={form.sampleWorks}
        onChange={(e) => setForm((f) => ({ ...f, sampleWorks: e.target.value }))}
        required
        className="min-h-24 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm"
      />
      {message && <p className="text-sm text-primary">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t("common.loading") : t("auth.submitRequest")}
      </Button>
    </form>
  );
}
