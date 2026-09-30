import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * The frame for signed-in pages. A layout does not re-run on every navigation, so it is NOT the security
 * check: every page below also calls requireUser() / requireCapability() itself, and every server action
 * checks again through runAction().
 */
export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return <AdminShell user={user}>{children}</AdminShell>;
}
