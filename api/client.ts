import { env } from "@/config/env";
import { useAuthStore } from "@/stores/auth-store";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
    /** Stable machine-readable code from the backend, e.g. PLAYLIST_LIMIT_REACHED */
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  /** Plain object (sent as JSON) or FormData (sent as multipart). */
  body?: unknown;
  /** Overrides the token from the auth store; rarely needed. */
  token?: string | null;
  /** Skip the Authorization header entirely (public endpoints). */
  anonymous?: boolean;
  /** Appended to the URL as a query string, skipping null/undefined values. */
  query?: Record<string, string | number | boolean | null | undefined>;
};

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = `${env.apiUrl}${path}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/**
 * Shared HTTP client for every service.
 *
 * Reads the JWT from the auth store rather than making each caller thread a
 * token through, so a single place decides how requests are authenticated.
 * `FormData` bodies are passed through untouched — setting Content-Type by hand
 * would strip the multipart boundary the browser generates.
 */
export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, token, anonymous, query, headers, ...rest } = options;

  const authToken = anonymous ? null : (token ?? useAuthStore.getState().token);
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const response = await fetch(buildUrl(path, query), {
    ...rest,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    body:
      body === undefined
        ? undefined
        : isFormData
          ? (body as FormData)
          : JSON.stringify(body),
  });

  if (!response.ok) {
    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    const record = (data ?? {}) as Record<string, unknown>;
    const code = typeof record.code === "string" ? record.code : undefined;
    const detail =
      typeof record.detail === "string"
        ? record.detail
        : `API Error: ${response.status} ${response.statusText}`;

    // An expired or revoked token should not leave the app in a half-signed-in
    // state where every subsequent request fails silently.
    if (response.status === 401 && !anonymous) {
      useAuthStore.getState().logout();
    }

    throw new ApiError(response.status, detail, data, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/** Builds a multipart body, skipping empty values and expanding arrays. */
export function toFormData(fields: Record<string, unknown>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      // DRF reads repeated keys as a list.
      value.forEach((item) => form.append(key, String(item)));
    } else if (value instanceof Blob) {
      form.append(key, value);
    } else {
      form.append(key, String(value));
    }
  }
  return form;
}
