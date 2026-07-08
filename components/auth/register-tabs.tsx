"use client";

import { useState } from "react";
import { ArtistRegisterForm } from "@/components/auth/artist-register-form";
import { ListenerRegisterForm } from "@/components/auth/listener-register-form";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

type Tab = "listener" | "artist";

export function RegisterTabs() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("listener");

  return (
    <div className="space-y-6">
      <div className="flex rounded-lg bg-muted p-1">
        <button
          type="button"
          onClick={() => setTab("listener")}
          className={cn(
            "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
            tab === "listener" && "bg-background shadow",
          )}
        >
          {t("auth.listener")}
        </button>
        <button
          type="button"
          onClick={() => setTab("artist")}
          className={cn(
            "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
            tab === "artist" && "bg-background shadow",
          )}
        >
          {t("auth.artist")}
        </button>
      </div>

      {tab === "listener" ? <ListenerRegisterForm /> : <ArtistRegisterForm />}
    </div>
  );
}
