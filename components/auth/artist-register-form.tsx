"use client";

import { useState } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea";
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="artist-email">{t("common.email")}</Label>
          <Input
            id="artist-email"
            type="email"
            dir="ltr"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="artist-password">{t("common.password")}</Label>
          <Input
            id="artist-password"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="artist-stage-name">{t("auth.stageName")}</Label>
        <Input
          id="artist-stage-name"
          value={form.stageName}
          onChange={(e) => setForm((f) => ({ ...f, stageName: e.target.value }))}
          required
        />
      </div>
      <div>
        <Label htmlFor="artist-sample-works">{t("auth.sampleWorks")}</Label>
        <Textarea
          id="artist-sample-works"
          value={form.sampleWorks}
          onChange={(e) =>
            setForm((f) => ({ ...f, sampleWorks: e.target.value }))
          }
          required
          rows={3}
        />
      </div>
      {message && <p className="text-sm text-primary">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t("common.loading") : t("auth.submitRequest")}
      </Button>
    </form>
  );
}
