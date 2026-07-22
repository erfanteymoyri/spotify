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
    <div className="space-y-4">
      <div className="flex rounded-xl bg-muted/70 p-1">
        <button
          type="button"
          onClick={() => setTab("listener")}
          className={cn(
            "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
            tab === "listener"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t("auth.listener")}
        </button>
        <button
          type="button"
          onClick={() => setTab("artist")}
          className={cn(
            "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
            tab === "artist"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t("auth.artist")}
        </button>
      </div>

      {tab === "listener" ? <ListenerRegisterForm /> : <ArtistRegisterForm />}
    </div>
  );
}
