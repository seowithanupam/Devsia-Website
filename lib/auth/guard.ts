import "server-only";
import { can, type Capability } from "@/lib/auth/capabilities";
import { getCurrentUser, type SessionUser } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/env";
import type { ActionState } from "@/lib/admin/action-state";
import { describeDuplicateKey } from "@/lib/cms/duplicate";

type Options = { allowPasswordChange?: boolean };

/**
 * Wraps every admin server action. Server actions are public HTTP endpoints, so each one must check the
 * session and the role itself, on the server, before doing anything. This wrapper is the one place that does it:
 * signed in, account active, password not pending a change, and the required capability held.
 */
export async function runAction(capability: Capability | null, work: (user: SessionUser) => Promise<ActionState>, options: Options = {}): Promise<ActionState> {
  try {
    if (!isDatabaseConfigured()) return { ok: false, message: "The database is not configured. Set MONGODB_URI first." };
    const user = await getCurrentUser();
    if (!user) return { ok: false, message: "Your session has ended. Please sign in again." };
    if (user.mustChangePassword && !options.allowPasswordChange) return { ok: false, message: "Change your password on the Profile page first." };
    if (capability && !can(user.role, capability)) return { ok: false, message: "You do not have permission to do this." };
    return await work(user);
  } catch (error) {
    // redirect() and notFound() work by throwing; let them through.
    const digest = (error as { digest?: unknown } | null)?.digest;
    if (typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND"))) throw error;
    // A duplicate email or slug (for example two people saving at once) gets a clear message, not "something went wrong".
    const duplicate = describeDuplicateKey(error);
    if (duplicate) return { ok: false, message: duplicate.message, errors: duplicate.field ? { [duplicate.field]: duplicate.message } : undefined };
    console.error("[admin action] failed:", error instanceof Error ? error.message : "unknown error");
    return { ok: false, message: "Something went wrong and nothing was saved. Please try again." };
  }
}
