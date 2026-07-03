"use client";

import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6 rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm backdrop-blur-sm sm:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary sm:text-3xl">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
