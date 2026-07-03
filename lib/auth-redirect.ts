import { routes } from "@/config/site";
import type { UserRole } from "@/types";

export function getAuthRedirectPath(role: UserRole): string {
  switch (role) {
    case "admin":
    case "support":
      return routes.adminDashboard;
    case "artist":
      return routes.artistDashboard;
    default:
      return routes.home;
  }
}
