"use client";

import { Music2 } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "@/hooks/use-translation";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-6">
      <div className="grid w-full max-w-md overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-2xl shadow-black/10 backdrop-blur-md lg:max-w-4xl lg:grid-cols-[2fr_3fr]">
        {/* Brand panel — hidden on small screens */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary/25 via-primary/10 to-transparent p-8 lg:flex">
          <div className="pointer-events-none absolute -top-24 -left-24 size-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 -bottom-32 size-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <Music2 className="size-6" />
            </span>
            <span className="text-2xl font-bold">{title}</span>
          </div>
          <p className="relative max-w-60 text-2xl leading-11 font-bold">
            {t("app.tagline")}
          </p>
          <p className="relative text-sm leading-6 text-muted-foreground">
            {t("app.description")}
          </p>
        </div>

        {/* Form panel */}
        <div className="space-y-5 p-6 sm:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary lg:hidden">{title}</h1>
            {subtitle && (
              <p className="mt-1.5 text-base font-medium text-muted-foreground lg:mt-0 lg:text-lg lg:font-semibold lg:text-foreground">
                {subtitle}
              </p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
