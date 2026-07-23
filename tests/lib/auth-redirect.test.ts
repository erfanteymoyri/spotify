import { describe, expect, it } from "vitest";
import { getAuthRedirectPath } from "@/lib/auth-redirect";
import { routes } from "@/config/site";

describe("getAuthRedirectPath", () => {
  it("sends admins and support agents to the admin dashboard", () => {
    expect(getAuthRedirectPath("admin")).toBe(routes.adminDashboard);
    expect(getAuthRedirectPath("support")).toBe(routes.adminDashboard);
  });

  it("sends artists to their works dashboard", () => {
    expect(getAuthRedirectPath("artist")).toBe(routes.artistDashboard);
  });

  it("sends listeners to the home page", () => {
    expect(getAuthRedirectPath("listener")).toBe(routes.home);
  });
});
