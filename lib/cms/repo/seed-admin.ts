import "server-only";
import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "@/lib/auth/password-policy";
import { optionalEnv } from "@/lib/env";
import { isValidEmail } from "@/lib/cms/validate";
import { writeAuditDirect } from "@/lib/cms/repo/audit";
import { UserModel } from "@/lib/db/models";


/**
 * Creates the first admin from SEED_ADMIN_NAME, SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD, but only when the
 * users collection is empty. The account must change its password at first sign-in (/admin/profile).
 * The values are read here on the server and are never sent to the browser or written to the log.
 * Safe to call repeatedly: an existing user (or a race with another instance) is simply left alone.
 */
export async function ensureSeedAdmin(): Promise<"created" | "skipped"> {
  if ((await UserModel.estimatedDocumentCount()) > 0) return "skipped";
  const name = optionalEnv("SEED_ADMIN_NAME");
  const email = optionalEnv("SEED_ADMIN_EMAIL")?.toLowerCase();
  const password = optionalEnv("SEED_ADMIN_PASSWORD");
  if (!name || !email || !password) {
    console.warn("[bootstrap] No admin exists and SEED_ADMIN_NAME / SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD are not all set, so no admin was created.");
    return "skipped";
  }
  if (!isValidEmail(email)) {
    console.warn("[bootstrap] SEED_ADMIN_EMAIL is not a valid email address, so no admin was created.");
    return "skipped";
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const result = await UserModel.updateOne(
    { email },
    { $setOnInsert: { name: name.slice(0, 80), email, passwordHash, role: "super_admin", active: true, mustChangePassword: true, failedAttempts: 0, lockedUntil: null } },
    { upsert: true },
  );
  if (result.upsertedCount === 1) {
    console.info("[bootstrap] First admin account created. Sign in at /admin/login and change the password.");
    // No email in the log entry's text beyond the account itself; the password is never involved.
    await writeAuditDirect({
      actor: null,
      action: "user.create",
      entityType: "user",
      entityId: String(result.upsertedId ?? ""),
      summary: `First admin account created from the server's seed settings: ${email}`,
      meta: { role: "super_admin", seeded: true },
    });
    return "created";
  }
  return "skipped";
}
