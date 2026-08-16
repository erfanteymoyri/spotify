"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuthStore } from "@/stores/auth-store";

interface AuthContextValue {
  user: ReturnType<typeof useAuthStore.getState>["user"];
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Selectors rather than `useAuthStore()`: subscribing to the whole store
  // re-rendered this provider — which wraps the entire application — on every
  // auth-store write, including ones that touch neither field below.
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // A fresh object here is a new context value, and a new context value
  // re-renders every `useAuth()` consumer whether or not anything changed.
  const value = useMemo(
    () => ({ user, isAuthenticated }),
    [user, isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
