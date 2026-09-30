/**
 * Roles and capabilities for the admin panel.
 *
 * SOURCE: the Handover Documentation section 02 lists the three roles in prose and names the capability
 * each screen requires. It does not give a grant table, so ROLE_CAPABILITIES is the reading recorded in the
 * Rebuild Specification (section 5). One point is implied, not stated: super_admin also holds seo.manage
 * ("full access"). Change grants here and nowhere else.
 */
export const ROLES = ["super_admin", "content_editor", "seo_manager"] as const;
export type Role = (typeof ROLES)[number];

export const CAPABILITIES = [
  "pages.manage",
  "blogs.manage",
  "nav.manage",
  "media.manage",
  "seo.manage",
  "settings.manage",
  "leads.view",
  "roles.manage",
  "audit.view",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super admin",
  content_editor: "Content editor",
  seo_manager: "SEO manager",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: "Full access. The only role that can manage staff accounts, settings and the audit log.",
  content_editor: "Day-to-day content: pages, legal documents, insights articles, navigation, media, and the leads mirror.",
  seo_manager: "Search visibility only: page SEO, the property SEO template and per-listing overrides.",
};

export const ROLE_CAPABILITIES: Record<Role, readonly Capability[]> = {
  super_admin: CAPABILITIES,
  content_editor: ["pages.manage", "blogs.manage", "nav.manage", "media.manage", "leads.view"],
  seo_manager: ["seo.manage"],
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function isCapability(value: unknown): value is Capability {
  return typeof value === "string" && (CAPABILITIES as readonly string[]).includes(value);
}

/** True when the role holds the capability. Unknown or missing roles hold nothing. */
export function can(role: Role | null | undefined, capability: Capability): boolean {
  if (!role || !isRole(role)) return false;
  return ROLE_CAPABILITIES[role].includes(capability);
}

export function capabilitiesOf(role: Role): readonly Capability[] {
  return ROLE_CAPABILITIES[role];
}
