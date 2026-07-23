import { beforeEach, describe, expect, it } from "vitest";
import { authMockStorage } from "@/lib/auth-mock-storage";

beforeEach(() => localStorage.clear());

describe("demo account seeding", () => {
  it("seeds the tiered demo listeners on first read", () => {
    const emails = authMockStorage.getAllUsers().map((u) => u.email);
    expect(emails).toContain("listener@demo.com");
    expect(emails).toContain("silver@demo.com");
    expect(emails).toContain("gold@demo.com");
  });

  it("assigns the right tiers to the demo listeners", () => {
    const byEmail = (e: string) =>
      authMockStorage.getAllUsers().find((u) => u.email === e);
    expect(byEmail("silver@demo.com")?.subscription).toBe("silver");
    expect(byEmail("gold@demo.com")?.subscription).toBe("gold");
  });

  it("self-heals a deleted demo account on the next read", () => {
    const listener = authMockStorage.findByEmail("listener@demo.com")!;
    authMockStorage.deleteUser(listener.id);
    // Re-reading restores the missing demo account (matched by email)
    expect(authMockStorage.findByEmail("listener@demo.com")).toBeDefined();
  });
});

describe("validateLogin", () => {
  it("accepts the correct demo credentials", () => {
    const user = authMockStorage.validateLogin(
      "listener@demo.com",
      "demo123456",
    );
    expect(user).not.toBeNull();
    expect(user?.role).toBe("listener");
  });

  it("rejects a wrong password", () => {
    expect(
      authMockStorage.validateLogin("listener@demo.com", "wrong"),
    ).toBeNull();
  });

  it("never leaks the password on the public user", () => {
    const user = authMockStorage.validateLogin(
      "listener@demo.com",
      "demo123456",
    );
    expect(user).not.toHaveProperty("password");
  });
});

describe("registerListener", () => {
  it("creates a free-tier listener from the email local part", () => {
    const user = authMockStorage.registerListener({
      displayName: "New User",
      email: "New@Example.com",
      password: "secret123",
      birthDate: "2000-01-01",
      gender: "male",
    });
    expect(user.subscription).toBe("free");
    expect(user.email).toBe("new@example.com"); // normalized to lowercase
    // Username derives from the email local part (case preserved) + suffix
    expect(user.username.toLowerCase().startsWith("new")).toBe(true);
  });

  it("rejects a duplicate email", () => {
    expect(() =>
      authMockStorage.registerListener({
        displayName: "Dup",
        email: "listener@demo.com",
        password: "secret123",
        birthDate: "2000-01-01",
        gender: "female",
      }),
    ).toThrow(/EMAIL_EXISTS/);
  });
});

describe("updateUser", () => {
  it("patches a stored field and returns the public view", () => {
    const listener = authMockStorage.findByEmail("listener@demo.com")!;
    const updated = authMockStorage.updateUser(listener.id, {
      displayName: "Renamed",
    });
    expect(updated.displayName).toBe("Renamed");
    expect(authMockStorage.getPublicById(listener.id)?.displayName).toBe(
      "Renamed",
    );
  });
});
