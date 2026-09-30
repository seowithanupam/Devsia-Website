import "server-only";
import { MAX_FAILURES_PER_IP, WINDOW_MINUTES, clientIpFromHeaders, ipKey } from "@/lib/auth/ip-throttle";
import { afterFailure, isLocked } from "@/lib/auth/lockout";
import { dummyHash, verifyPassword } from "@/lib/auth/password";
import { isValidEmail } from "@/lib/cms/validate";
import { writeAudit } from "@/lib/cms/repo/audit";
import { isNetworkBlocked, recordNetworkFailure } from "@/lib/cms/repo/login-throttle";
import { findUserWithSecretByEmail, recordLoginFailure, recordLoginSuccess } from "@/lib/cms/repo/users";
import { optionalEnv } from "@/lib/env";
import type { Role } from "@/lib/auth/capabilities";

export type AuthorizedUser = { id: string; name: string; email: string; role: Role; sessionVersion: number };

const MAX_PASSWORD_INPUT = 256;

/** Keyed hash of the visitor's address, or null when it cannot be worked out (then per-network throttling is skipped). */
function networkKey(request: Request | undefined): string | null {
  const secret = optionalEnv("AUTH_SECRET");
  if (!secret) return null;
  return ipKey(clientIpFromHeaders((name) => request?.headers.get(name)), secret);
}

/**
 * Checks an email and password for the Auth.js credentials provider.
 * Returns the user or null. Every failure looks the same to the caller (no hint whether the email exists,
 * whether the account is inactive or locked, or whether this network is throttled). Failures on real accounts are audit-logged.
 *
 * Two independent brakes apply: the per-account lockout (5 failures) and a per-network limit (20 failures in 15 minutes).
 */
export async function authorizeCredentials(raw: Partial<Record<string, unknown>>, request?: Request): Promise<AuthorizedUser | null> {
  const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
  const password = typeof raw.password === "string" ? raw.password : "";
  if (!isValidEmail(email) || password.length === 0 || password.length > MAX_PASSWORD_INPUT) return null;

  const network = networkKey(request);
  const failedFromNetwork = async () => {
    if (!network) return;
    const { justBlocked } = await recordNetworkFailure(network, new Date());
    if (justBlocked) {
      await writeAudit({
        actor: null,
        action: "auth.throttled",
        entityType: "auth",
        summary: "Sign-in throttled: too many failed attempts from one network",
        meta: { maxFailures: MAX_FAILURES_PER_IP, windowMinutes: WINDOW_MINUTES },
      });
    }
  };

  if (network && (await isNetworkBlocked(network, new Date()))) {
    await verifyPassword(password, await dummyHash());
    return null;
  }

  const user = await findUserWithSecretByEmail(email);
  if (!user) {
    await verifyPassword(password, await dummyHash());
    await failedFromNetwork();
    return null;
  }

  const now = new Date();
  const actor = { id: user.id, email: user.email, role: user.role };

  if (!user.active || isLocked({ failedAttempts: user.failedAttempts, lockedUntil: user.lockedUntil }, now)) {
    await verifyPassword(password, await dummyHash());
    await failedFromNetwork();
    return null;
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    const next = afterFailure({ failedAttempts: user.failedAttempts, lockedUntil: user.lockedUntil }, now);
    await recordLoginFailure(user.id, next);
    await writeAudit({ actor, action: "auth.login_failed", entityType: "user", entityId: user.id, summary: `Failed sign-in for ${user.email}`, meta: { attempts: next.failedAttempts } });
    if (next.lockedUntil) {
      await writeAudit({ actor, action: "auth.locked", entityType: "user", entityId: user.id, summary: `Account locked after repeated failed sign-ins: ${user.email}` });
    }
    await failedFromNetwork();
    return null;
  }

  await recordLoginSuccess(user.id);
  await writeAudit({ actor, action: "auth.login", entityType: "user", entityId: user.id, summary: `Signed in: ${user.email}` });
  return { id: user.id, name: user.name, email: user.email, role: user.role, sessionVersion: user.sessionVersion };
}
