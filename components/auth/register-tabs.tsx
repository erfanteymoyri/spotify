"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ArtistRegisterForm } from "@/components/auth/artist-register-form";
import { ListenerRegisterForm } from "@/components/auth/listener-register-form";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

type Tab = "listener" | "artist";

export function RegisterTabs() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("listener");

  const tabs = [
    { value: "listener" as const, label: t("auth.listener") },
    { value: "artist" as const, label: t("auth.artist") },
  ];

  return (
    <div className="space-y-4">
      <div className="flex rounded-xl bg-muted/70 p-1">
        {tabs.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              "relative flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
              tab === value
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {/* Shared-layout pill slides between the tabs */}
            {tab === value && (
              <motion.span
                layoutId="register-tab-pill"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-lg bg-primary shadow-md shadow-primary/20"
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        ))}
      </div>

      {tab === "listener" ? <ListenerRegisterForm /> : <ArtistRegisterForm />}
    </div>
  );
}
