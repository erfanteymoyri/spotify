import { env } from "@/config/env";

export function shouldUseBackend(capability: boolean): boolean {
  return !env.isMockMode && capability;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
