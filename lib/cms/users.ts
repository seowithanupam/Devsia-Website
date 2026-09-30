import { isRole, type Role } from "@/lib/auth/capabilities";
import { checkPassword } from "@/lib/auth/password-policy";
import { cleanSingleLine, hasErrors, isValidEmail, type FieldErrors } from "./validate";

export type NewUserInput = { name: string; email: string; role: Role; password: string };
export type NewUserValidation = { ok: true; value: NewUserInput } | { ok: false; errors: FieldErrors };

export function validateNewUser(input: Record<string, unknown>): NewUserValidation {
  const errors: FieldErrors = {};
  const name = cleanSingleLine(input.name, 80);
  const email = cleanSingleLine(input.email, 254).toLowerCase();
  const role = input.role;
  const password = typeof input.password === "string" ? input.password : "";
  if (!name) errors.name = "Enter a name.";
  if (!isValidEmail(email)) errors.email = "Enter a valid email address.";
  if (!isRole(role)) errors.role = "Choose a role.";
  const passwordProblem = checkPassword(password, { email, name });
  if (passwordProblem) errors.password = passwordProblem;
  if (hasErrors(errors) || !isRole(role)) return { ok: false, errors };
  return { ok: true, value: { name, email, role, password } };
}

export type UserChange = {
  actorId: string;
  target: { id: string; role: Role; active: boolean };
  next: { role: Role; active: boolean };
  /** Number of active super_admin accounts right now, including the target if it is one. */
  activeSuperAdmins: number;
};

/** Rules that stop staff locking themselves or everyone else out. Returns an error message, or null when allowed. */
export function checkUserChange({ actorId, target, next, activeSuperAdmins }: UserChange): string | null {
  const changesRole = next.role !== target.role;
  const changesActive = next.active !== target.active;
  if (!changesRole && !changesActive) return null;
  if (actorId === target.id) return "You cannot change your own role or deactivate your own account. Ask another super admin.";
  const losesSuper = target.role === "super_admin" && target.active && (next.role !== "super_admin" || !next.active);
  if (losesSuper && activeSuperAdmins <= 1) return "At least one active super admin must remain.";
  return null;
}
