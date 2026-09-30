/**
 * Password rules for admin accounts.
 * PROPOSAL: the handover only says the seeded password must be changed at first login. Minimum length and
 * the other rules below are new and can be tightened in this one file.
 */
/** bcrypt work factor. PROPOSAL: the original hashing settings were not recorded. */
export const BCRYPT_ROUNDS = 12;

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

const COMMON = new Set(["password", "password1", "1234567890", "qwertyuiop", "letmein123", "admin12345", "changeme123", "welcome123"]);

export function checkPassword(password: string, context: { email?: string; name?: string } = {}): string | null {
  if (typeof password !== "string" || password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (password.length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Include at least one letter and one number.";
  const lower = password.toLowerCase();
  if (COMMON.has(lower)) return "That password is too common.";
  const local = (context.email ?? "").split("@")[0]?.toLowerCase();
  if (local && local.length >= 4 && lower.includes(local)) return "The password must not contain your email name.";
  return null;
}
