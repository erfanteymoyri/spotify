/**
 * Environment variables — set in .env.local after backend is ready:
 *
 * NEXT_PUBLIC_API_URL=http://localhost:8000/api
 */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
  isMockMode: process.env.NEXT_PUBLIC_MOCK_MODE !== "false",
} as const;
