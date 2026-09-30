import { can, type Capability, type Role } from "@/lib/auth/capabilities";

export type AdminNavItem = { href: string; label: string; capability: Capability | null };

/** The admin screens, in the order of the handover's screen table. `capability: null` means any signed-in role. */
export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", capability: null },
  { href: "/admin/pages", label: "Pages", capability: "pages.manage" },
  { href: "/admin/blogs", label: "Blog posts", capability: "blogs.manage" },
  { href: "/admin/nav", label: "Navigation", capability: "nav.manage" },
  { href: "/admin/media", label: "Media", capability: "media.manage" },
  { href: "/admin/seo", label: "SEO", capability: "seo.manage" },
  { href: "/admin/legal", label: "Legal documents", capability: "pages.manage" },
  { href: "/admin/settings", label: "Settings", capability: "settings.manage" },
  { href: "/admin/leads", label: "Leads mirror", capability: "leads.view" },
  { href: "/admin/roles", label: "Roles and users", capability: "roles.manage" },
  { href: "/admin/audit", label: "Audit log", capability: "audit.view" },
  { href: "/admin/profile", label: "Profile", capability: null },
];

export function visibleNav(role: Role): AdminNavItem[] {
  return ADMIN_NAV.filter((item) => item.capability === null || can(role, item.capability));
}

/** The active item for a path: the longest matching href ("/admin/seo/property/x" -> SEO, "/admin" only for exactly /admin). */
export function activeNavHref(pathname: string): string | null {
  let best: string | null = null;
  for (const item of ADMIN_NAV) {
    const match = item.href === "/admin" ? pathname === "/admin" : pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (match && (best === null || item.href.length > best.length)) best = item.href;
  }
  return best;
}
