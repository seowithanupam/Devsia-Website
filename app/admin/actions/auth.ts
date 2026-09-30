"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import type { ActionState } from "@/lib/admin/action-state";
import { getCurrentUser } from "@/lib/auth/session";
import { writeAudit } from "@/lib/cms/repo/audit";
import { isAuthConfigured, isDatabaseConfigured } from "@/lib/env";

/** Only same-site admin paths are accepted as a place to return to after sign-in (no open redirect). */
function safeReturnPath(value: FormDataEntryValue | null): string {
  const path = typeof value === "string" ? value : "";
  return /^\/admin(\/[A-Za-z0-9\-_/]*)?$/.test(path) && !path.startsWith("/admin/login") ? path : "/admin";
}

/** The message of the error underneath an Auth.js wrapper error, for the server log. */
function underlyingMessage(error: AuthError): string {
  const cause: unknown = error.cause;
  const inner: unknown = typeof cause === "object" && cause !== null && "err" in cause ? (cause as { err?: unknown }).err : cause;
  return inner instanceof Error ? inner.message : "unknown reason";
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isDatabaseConfigured() || !isAuthConfigured()) {
    return { ok: false, message: "Admin sign-in is not set up yet. MONGODB_URI and AUTH_SECRET must be set on the server." };
  }
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: safeReturnPath(formData.get("next")),
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        // One message for every real credential failure: wrong email, wrong password, inactive or locked account.
        return { ok: false, message: "That email and password did not match, or the account is locked. Try again in a few minutes." };
      }
      // Any other Auth.js error means the check itself could not run (typically the database was unreachable).
      // Saying "wrong password" here would send people chasing the wrong problem, so say what actually happened.
      // The exact reason goes to the server log only, never to the browser.
      console.error("[admin login] the sign-in could not be checked:", error.type, underlyingMessage(error));
      return { ok: false, message: "Sign-in is unavailable because the server could not check your account. The database may be unreachable. Your password was not the problem. The exact reason is in the server log." };
    }
    throw error; // the redirect after a successful sign-in is thrown and must pass through
  }
}

export async function logoutAction(): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (user) await writeAudit({ actor: user, action: "auth.logout", entityType: "user", entityId: user.id, summary: `Signed out: ${user.email}` });
  } catch {
    // Signing out must always work, even if the database or the audit log is unavailable.
  }
  await signOut({ redirectTo: "/admin/login" });
}
