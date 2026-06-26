"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { mockCurrentUser } from "@/lib/mock-data";

/**
 * Auth context — currently uses mock data.
 * After backend integration, user is populated from authStore and GET /auth/me.
 */
interface AuthContextValue {
  user: ReturnType<typeof useAuthStore.getState>["user"];
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();

  // In mock mode, show sample user when not logged in
  const effectiveUser = user ?? mockCurrentUser;
  const effectiveAuth = isAuthenticated || true;

  return (
    <AuthContext.Provider
      value={{ user: effectiveUser, isAuthenticated: effectiveAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
