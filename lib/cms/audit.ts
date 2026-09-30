/** Pure helpers for the audit log. The database write is in lib/cms/repo/audit.ts. */

export const AUDIT_ACTIONS = [
  "auth.login",
  "auth.login_failed",
  "auth.locked",
  "auth.throttled",
  "auth.logout",
  "page.update",
  "page.reset",
  "post.create",
  "post.update",
  "post.publish",
  "post.unpublish",
  "post.delete",
  "nav.update",
  "settings.update",
  "seo.page.update",
  "seo.template.update",
  "seo.property.update",
  "seo.property.delete",
  "legal.update",
  "media.upload",
  "media.delete",
  "media.update",
  "user.create",
  "user.update",
  "user.reset_password",
  "profile.update",
  "profile.password_change",
  "content.seed",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** Names of the fields whose values differ. Values are never logged, so personal data and secrets cannot leak into the log. */
export function changedKeys(before: Record<string, unknown> | null | undefined, after: Record<string, unknown>, keys?: string[]): string[] {
  const names = keys ?? [...new Set([...Object.keys(before ?? {}), ...Object.keys(after)])];
  return names.filter((k) => JSON.stringify(before?.[k] ?? null) !== JSON.stringify(after[k] ?? null));
}

export function summarizeChange(subject: string, changed: string[]): string {
  if (changed.length === 0) return `${subject}: saved with no changes`;
  const list = changed.length > 6 ? `${changed.slice(0, 6).join(", ")} and ${changed.length - 6} more` : changed.join(", ");
  return `${subject}: changed ${list}`;
}
