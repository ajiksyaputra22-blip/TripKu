import { SessionPayload } from "./auth";

export type Role = "ADMIN" | "TRAVEL" | "CUSTOMER" | "GUIDE" | "DRIVER";

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMIN: ["admin:all", "travel:verify", "worker:verify", "users:manage", "monitoring:view"],
  TRAVEL: ["packages:manage", "bookings:view", "payments:verify", "trips:manage", "assignments:manage", "fees:manage", "triproom:post", "reports:view"],
  CUSTOMER: ["packages:view", "packages:compare", "bookings:create", "bookings:my", "payments:upload", "triproom:view", "reviews:create"],
  GUIDE: ["assignments:view", "assignments:respond", "trips:view", "trips:update", "fees:view"],
  DRIVER: ["assignments:view", "assignments:respond", "trips:view", "trips:update", "fees:view"],
};

export function hasPermission(userRole: Role, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission) || permissions.includes("admin:all");
}

export function getHomeRouteForRole(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "TRAVEL":
      return "/travel/dashboard";
    case "GUIDE":
      return "/guide/dashboard";
    case "DRIVER":
      return "/driver/dashboard";
    case "CUSTOMER":
    default:
      return "/";
  }
}

export function isAuthorizedRoute(pathname: string, user: SessionPayload | null): { allowed: boolean; redirectUrl?: string } {
  // Always allowed API and static routes
  if (
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/upload")
  ) {
    return { allowed: true };
  }

  // If user is logged in as partner/admin (TRAVEL, GUIDE, DRIVER, ADMIN)
  // they should focus strictly on their own workspace and NOT browse public catalog (/explore, /compare, /packages, /)
  if (user && user.role !== "CUSTOMER") {
    const homeRoute = getHomeRouteForRole(user.role as Role);

    // If attempting to visit auth pages or public exploration pages or root:
    if (
      pathname === "/" ||
      pathname.startsWith("/explore") ||
      pathname.startsWith("/compare") ||
      pathname.startsWith("/packages") ||
      pathname.startsWith("/auth") ||
      pathname.includes("/login") ||
      pathname.includes("/register") ||
      (pathname.startsWith("/customer") && !pathname.startsWith("/customer/trip-room"))
    ) {
      return { allowed: false, redirectUrl: homeRoute };
    }

    // Role-specific workspace boundaries
    if (pathname.startsWith("/admin") && user.role !== "ADMIN") {
      return { allowed: false, redirectUrl: homeRoute };
    }
    if (pathname.startsWith("/travel") && user.role !== "TRAVEL") {
      return { allowed: false, redirectUrl: homeRoute };
    }
    if (pathname.startsWith("/guide") && user.role !== "GUIDE") {
      return { allowed: false, redirectUrl: homeRoute };
    }
    if (pathname.startsWith("/driver") && user.role !== "DRIVER") {
      return { allowed: false, redirectUrl: homeRoute };
    }

    return { allowed: true };
  }

  // For CUSTOMER and Guests (Not logged in):
  // Public routes allowed:
  if (
    pathname === "/" ||
    pathname.startsWith("/explore") ||
    pathname.startsWith("/packages") && !pathname.includes("/book") ||
    pathname.startsWith("/compare") ||
    pathname.startsWith("/auth") ||
    pathname.includes("/login") ||
    pathname.includes("/register")
  ) {
    return { allowed: true };
  }

  // Not logged in trying to access protected customer or dashboard route:
  if (!user) {
    return { allowed: false, redirectUrl: `/login` };
  }

  // Customer cannot access partner/admin portals
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/travel") ||
    pathname.startsWith("/guide") ||
    pathname.startsWith("/driver")
  ) {
    return { allowed: false, redirectUrl: "/" };
  }

  return { allowed: true };
}
