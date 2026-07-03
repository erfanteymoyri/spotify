"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuthStore } from "@/stores/auth-store";

interface AuthContextValue {
  user: ReturnType<typeof useAuthStore.getState>["user"];
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <AuthContext.Provider value={{ user, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
