/**
 * Environment variables. Set in `.env.local`:
 *
 *   NEXT_PUBLIC_API_URL=http://localhost:8000/api
 */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
} as const;
