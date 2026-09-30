import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { can, type Capability, type Role } from "@/lib/auth/capabilities";
import { isSessionCurrent } from "@/lib/auth/session-version";
import { getUser } from "@/lib/cms/repo/users";
import { isAuthConfigured, isDatabaseConfigured } from "@/lib/env";

export type SessionUser = { id: string; name: string; email: string; role: Role; mustChangePassword: boolean };

/**
 * The signed-in admin, or null. The role, active flag and password-change flag come from the database on
 * every call, not from the cookie, so removing access takes effect at once. Cached for one request.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  if (!isAuthConfigured() || !isDatabaseConfigured()) return null;
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await getUser(id);
  if (!user || !user.active) return null;
  // A password change or reset raises the user's version, which ends every session issued before it.
  if (!isSessionCurrent(session?.user?.sessionVersion, user.sessionVersion)) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword };
});

/**
 * Call at the top of every admin page (a layout is not enough: layouts do not re-run on every navigation).
 * Sends signed-out visitors to the login page, and staff who still have a temporary password to the profile page.
 */
export async function requireUser(options: { allowPasswordChange?: boolean } = {}): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.mustChangePassword && !options.allowPasswordChange) redirect("/admin/profile?required=1");
  return user;
}

/** Call at the top of every admin page that needs a capability. Role checks happen on the server. */
export async function requireCapability(capability: Capability): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, capability)) redirect("/admin/forbidden");
  return user;
}
