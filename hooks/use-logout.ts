"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/config/site";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth-store";
import { usePlayerStore } from "@/stores/player-store";

/** Shared logout flow: invalidate the session, clear state and go to login */
export function useLogout() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    if (loading) return;
    setLoading(true);
    const { token, logout: clearAuth } = useAuthStore.getState();
    try {
      if (token) await authService.logout(token);
    } finally {
      // Stop any playing audio before leaving the authenticated area
      usePlayerStore.getState().closePlayer();
      clearAuth();
      setLoading(false);
      router.replace(routes.login);
    }
  };

  return { logout, loading };
}
