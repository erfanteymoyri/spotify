"use client";

import { useSyncExternalStore } from "react";
import { useAuthStore } from "@/stores/auth-store";

function subscribeToAuthHydration(onStoreChange: () => void) {
  const persistApi = useAuthStore.persist;
  if (!persistApi || persistApi.hasHydrated()) {
    return () => {};
  }

  return persistApi.onFinishHydration(onStoreChange);
}

function getAuthHydrationSnapshot() {
  const persistApi = useAuthStore.persist;
  return !persistApi || persistApi.hasHydrated();
}

export function useAuthHydrated() {
  return useSyncExternalStore(
    subscribeToAuthHydration,
    getAuthHydrationSnapshot,
    () => false,
  );
}
