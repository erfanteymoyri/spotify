import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiClient, toFormData } from "@/api/client";
import { useAuthStore } from "@/stores/auth-store";
import type { User } from "@/types";

/**
 * `apiClient` is the single seam between the app and the Django API — every
 * service goes through it — so its behaviour is worth pinning down: how the
 * token is attached, how multipart is passed through untouched, and how errors
 * are surfaced.
 */

const BASE = "http://localhost:8000/api";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function fakeUser(): User {
  return {
    id: "user-1",
    username: "tester",
    displayName: "Tester",
    role: "listener",
    avatarUrl: null,
    subscription: "free",
    followersCount: 0,
    followingCount: 0,
    dailyStreamsCount: 0,
    createdAt: "2026-01-01T00:00:00Z",
  };
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
  vi.stubGlobal("fetch", fetchMock);
  useAuthStore.getState().logout();
});

afterEach(() => {
  vi.unstubAllGlobals();
  useAuthStore.getState().logout();
});

/** The `RequestInit` the client handed to `fetch` on its Nth call. */
function requestInit(call = 0): RequestInit {
  return fetchMock.mock.calls[call][1] as RequestInit;
}

/** Await a request expected to fail, and hand back the typed error. */
async function expectApiError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error("expected the request to reject with an ApiError");
}

function requestHeaders(call = 0): Record<string, string> {
  return requestInit(call).headers as Record<string, string>;
}

describe("authentication", () => {
  it("attaches the stored token so services never thread one through", async () => {
    useAuthStore.getState().setAuth(fakeUser(), "stored-token", "refresh-token");

    await apiClient("/auth/me");

    expect(requestHeaders().Authorization).toBe("Bearer stored-token");
  });

  it("sends no Authorization header when signed out", async () => {
    await apiClient("/tracks");
    expect(requestHeaders().Authorization).toBeUndefined();
  });

  it("omits the header for endpoints marked anonymous", async () => {
    useAuthStore.getState().setAuth(fakeUser(), "stored-token");

    await apiClient("/subscriptions/plans", { anonymous: true });

    expect(requestHeaders().Authorization).toBeUndefined();
  });

  it("clears the session when the API rejects the token", async () => {
    useAuthStore.getState().setAuth(fakeUser(), "expired-token");
    fetchMock.mockResolvedValue(jsonResponse({ detail: "Invalid token." }, 401));

    await expect(apiClient("/auth/me")).rejects.toBeInstanceOf(ApiError);

    // Otherwise the UI would look signed in while every request failed.
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().token).toBeNull();
  });

  it("leaves the session alone when an anonymous call 401s", async () => {
    useAuthStore.getState().setAuth(fakeUser(), "good-token");
    fetchMock.mockResolvedValue(jsonResponse({ detail: "nope" }, 401));

    await expect(
      apiClient("/subscriptions/plans", { anonymous: true }),
    ).rejects.toBeInstanceOf(ApiError);

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});

describe("request bodies", () => {
  it("serialises a plain object as JSON", async () => {
    await apiClient("/playlists", { method: "POST", body: { name: "Mix" } });

    expect(requestHeaders()["Content-Type"]).toBe("application/json");
    expect(requestInit().body).toBe(JSON.stringify({ name: "Mix" }));
  });

  it("passes FormData through without setting Content-Type", async () => {
    // Setting it by hand would strip the multipart boundary the browser adds.
    const form = new FormData();
    form.append("avatar", new Blob(["x"]), "avatar.png");

    await apiClient("/users/me/avatar", { method: "POST", body: form });

    expect(requestHeaders()["Content-Type"]).toBeUndefined();
    expect(requestInit().body).toBe(form);
  });

  it("sends no body when none was given", async () => {
    await apiClient("/notifications/read-all", { method: "PATCH" });
    expect(requestInit().body).toBeUndefined();
  });
});

describe("query strings", () => {
  it("appends provided parameters", async () => {
    await apiClient("/tracks", { query: { q: "iran", sort: "date", page: 2 } });

    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/tracks?q=iran&sort=date&page=2`);
  });

  it("drops empty values instead of sending blank filters", async () => {
    await apiClient("/tracks", {
      query: { q: "", sort: "date", genre: undefined, artistId: null },
    });

    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/tracks?sort=date`);
  });

  it("leaves the URL untouched with no query", async () => {
    await apiClient("/home");
    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/home`);
  });
});

describe("responses", () => {
  it("returns the parsed JSON body", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: "track-1", title: "Song" }));

    await expect(apiClient("/tracks/track-1")).resolves.toEqual({
      id: "track-1",
      title: "Song",
    });
  });

  it("returns undefined for 204 rather than trying to parse it", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(apiClient("/playlists/1", { method: "DELETE" })).resolves.toBeUndefined();
  });
});

describe("errors", () => {
  it("surfaces the backend's stable code so callers can branch on it", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { detail: "Playlist limit reached.", code: "PLAYLIST_LIMIT_REACHED" },
        403,
      ),
    );

    const error = await expectApiError(
      apiClient("/playlists", { method: "POST", body: { name: "Seventh" } }),
    );

    expect(error.status).toBe(403);
    expect(error.code).toBe("PLAYLIST_LIMIT_REACHED");
    expect(error.message).toBe("Playlist limit reached.");
  });

  it("keeps field errors on `data` for form display", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ email: ["An account with this email already exists."] }, 400),
    );

    const error = await expectApiError(
      apiClient("/auth/register", { method: "POST", body: {} }),
    );

    expect(error.data).toEqual({
      email: ["An account with this email already exists."],
    });
  });

  it("falls back to a status message when the body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>oops</html>", { status: 500 }));

    const error = await expectApiError(apiClient("/home"));

    expect(error.status).toBe(500);
    expect(error.message).toContain("500");
  });
});

describe("toFormData", () => {
  it("expands an array into repeated keys, which is what DRF reads as a list", () => {
    const form = toFormData({ collaborators: ["One", "Two"] });
    expect(form.getAll("collaborators")).toEqual(["One", "Two"]);
  });

  it("skips empty values so optional fields are simply absent", () => {
    const form = toFormData({ title: "Song", lyrics: "", genre: null, year: undefined });

    expect(form.get("title")).toBe("Song");
    expect(form.has("lyrics")).toBe(false);
    expect(form.has("genre")).toBe(false);
    expect(form.has("year")).toBe(false);
  });

  it("keeps files as files rather than stringifying them", () => {
    const file = new File(["audio"], "song.mp3", { type: "audio/mpeg" });
    const form = toFormData({ audio: file });

    expect(form.get("audio")).toBeInstanceOf(File);
  });

  it("stringifies numbers and booleans", () => {
    const form = toFormData({ releaseYear: 2026, published: true });

    expect(form.get("releaseYear")).toBe("2026");
    expect(form.get("published")).toBe("true");
  });
});
