"use client";

import { useEffect, useState } from "react";
import { musicService } from "@/services/music.service";
import type { HomeFeed } from "@/types";

export function useHomeFeed() {
  const [data, setData] = useState<HomeFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    musicService
      .getHomeFeed()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
