import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-b from-background via-background to-primary/10">
      {/* Decorative background glows */}
      <div className="pointer-events-none absolute -top-40 right-1/4 size-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 size-80 rounded-full bg-primary/5 blur-3xl" />
      {children}
    </div>
  );
}
