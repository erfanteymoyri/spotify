import { createId, readJson, writeJson } from "@/lib/local-store";
import type {
  ArtistProfile,
  ArtistRequest,
  Gender,
  User,
  UserRole,
} from "@/types";

const USERS_KEY = "spotify-mock-users";
const ARTIST_REQUESTS_KEY = "spotify-artist-requests";

interface StoredUser extends User {
  password: string;
}

export interface ArtistRegistrationRequest {
  id: string;
  email: string;
  password: string;
  stageName: string;
  sampleWorks: string;
  status: ArtistProfile["status"];
  createdAt: string;
}

function usernameFromEmail(email: string): string {
  const base = email.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "_") || "user";
  return `${base}_${Math.floor(Math.random() * 9000 + 1000)}`;
}

function seedUsers(): StoredUser[] {
  const now = new Date().toISOString();
  const base = (role: UserRole, email: string, displayName: string): StoredUser => ({
    id: createId("user"),
    username: email.split("@")[0] ?? "user",
    displayName,
    email,
    password: "demo123456",
    role,
    avatarUrl: null,
    subscription: role === "admin" ? "gold" : role === "artist" ? "silver" : "free",
    followersCount: 0,
    followingCount: 0,
    dailyStreamsCount: 0,
    createdAt: now,
  });

  return [
    base("listener", "listener@demo.com", "شنونده نمونه"),
    base("artist", "artist@demo.com", "هنرمند نمونه"),
    base("support", "support@demo.com", "پشتیبان نمونه"),
    base("admin", "admin@demo.com", "مدیر سامانه"),
  ];
}

function getUsers(): StoredUser[] {
  const users = readJson<StoredUser[] | null>(USERS_KEY, null);
  if (!users?.length) {
    const seeded = seedUsers();
    writeJson(USERS_KEY, seeded);
    return seeded;
  }
  return users;
}

function toPublicUser(user: StoredUser): User {
  const { password: _password, ...publicUser } = user;
  void _password;
  return publicUser;
}

export const authMockStorage = {
  findByEmail(email: string): StoredUser | undefined {
    return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  findById(id: string): StoredUser | undefined {
    return getUsers().find((u) => u.id === id);
  },

  /** Public (password-free) view of a stored user */
  getPublicById(id: string): User | undefined {
    const user = this.findById(id);
    return user ? toPublicUser(user) : undefined;
  },

  getAllUsers(): User[] {
    return getUsers().map(toPublicUser);
  },

  /** Patch a stored user (profile edits, follow counts) and return the public view */
  updateUser(id: string, patch: Partial<Omit<StoredUser, "id">>): User {
    const users = getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error("USER_NOT_FOUND");

    const updated: StoredUser = { ...users[index], ...patch };
    users[index] = updated;
    writeJson(USERS_KEY, users);
    return toPublicUser(updated);
  },

  validateLogin(email: string, password: string): User | null {
    const user = this.findByEmail(email);
    if (!user || user.password !== password) return null;
    return toPublicUser(user);
  },

  registerListener(data: {
    displayName: string;
    email: string;
    password: string;
    birthDate: string;
    gender: Gender;
  }): User {
    const users = getUsers();
    if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error("EMAIL_EXISTS");
    }

    const user: StoredUser = {
      id: createId("user"),
      username: usernameFromEmail(data.email),
      displayName: data.displayName.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      role: "listener",
      avatarUrl: null,
      subscription: "free",
      followersCount: 0,
      followingCount: 0,
      dailyStreamsCount: 0,
      birthDate: data.birthDate,
      gender: data.gender,
      createdAt: new Date().toISOString(),
    };

    writeJson(USERS_KEY, [...users, user]);
    return toPublicUser(user);
  },

  registerArtist(data: {
    email: string;
    password: string;
    stageName: string;
    sampleWorks: string;
  }): ArtistRegistrationRequest {
    const requests = readJson<ArtistRegistrationRequest[]>(ARTIST_REQUESTS_KEY, []);
    const request: ArtistRegistrationRequest = {
      id: createId("artist-req"),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      stageName: data.stageName.trim(),
      sampleWorks: data.sampleWorks.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    writeJson(ARTIST_REQUESTS_KEY, [...requests, request]);
    return request;
  },

  requestPasswordReset(email: string): boolean {
    return Boolean(this.findByEmail(email));
  },

  getArtistRequests(): ArtistRegistrationRequest[] {
    const stored = readJson<ArtistRegistrationRequest[] | null>(
      ARTIST_REQUESTS_KEY,
      null,
    );
    if (!stored?.length) {
      const seeded = seedArtistRequests();
      writeJson(ARTIST_REQUESTS_KEY, seeded);
      return seeded;
    }
    return stored;
  },

  /** Admin/support view — passwords stripped */
  getPublicArtistRequests(): ArtistRequest[] {
    return this.getArtistRequests().map(({ password: _password, ...req }) => {
      void _password;
      return req;
    });
  },

  reviewArtistRequest(id: string, action: "approve" | "reject"): void {
    const requests = this.getArtistRequests();
    const next = requests.map((req) =>
      req.id === id
        ? { ...req, status: action === "approve" ? "approved" : "rejected" }
        : req,
    );
    writeJson(ARTIST_REQUESTS_KEY, next);
  },
};

function seedArtistRequests(): ArtistRegistrationRequest[] {
  const now = Date.now();
  const make = (
    stageName: string,
    email: string,
    sampleWorks: string,
    daysAgo: number,
  ): ArtistRegistrationRequest => ({
    id: createId("artist-req"),
    email,
    password: "demo123456",
    stageName,
    sampleWorks,
    status: "pending",
    createdAt: new Date(now - daysAgo * 86_400_000).toISOString(),
  });

  return [
    make(
      "مهدی یراحی",
      "yarahi@demo.com",
      "لینک نمونه‌کارها: soundcloud.com/yarahi — سبک پاپ اجتماعی",
      1,
    ),
    make(
      "زانیار خسروی",
      "zaniar@demo.com",
      "چند تک‌آهنگ منتشرشده در سبک پاپ",
      3,
    ),
  ];
}
