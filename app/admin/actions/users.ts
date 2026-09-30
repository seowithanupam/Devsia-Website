"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/admin/action-state";
import { formToObject } from "@/lib/admin/form-data";
import { isRole } from "@/lib/auth/capabilities";
import { runAction } from "@/lib/auth/guard";
import { hashPassword } from "@/lib/auth/password";
import { checkPassword } from "@/lib/auth/password-policy";
import { writeAudit } from "@/lib/cms/repo/audit";
import { countActiveSuperAdmins, createUser, findUserWithSecretByEmail, getUser, setUserPassword, updateUserAccess } from "@/lib/cms/repo/users";
import { checkUserChange, validateNewUser } from "@/lib/cms/users";

/** Only super_admin holds roles.manage, so only they can reach any action in this file. */
export async function createUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("roles.manage", async (actor) => {
    const validation = validateNewUser(formToObject(formData));
    if (!validation.ok) return { ok: false, message: "Some fields need attention. Nothing was saved.", errors: validation.errors };
    const { name, email, role, password } = validation.value;
    if (await findUserWithSecretByEmail(email)) return { ok: false, message: "An account with that email already exists.", errors: { email: "Already in use." } };
    // The new person must choose their own password at first sign-in. The temporary one is shared by hand.
    const user = await createUser({ name, email, role, passwordHash: await hashPassword(password), mustChangePassword: true });
    await writeAudit({ actor, action: "user.create", entityType: "user", entityId: user.id, summary: `Account created: ${email} as ${role}`, meta: { role } });
    revalidatePath("/admin/roles");
    return { ok: true, message: `Account created for ${email}. Give them the temporary password; they must change it at first sign-in.` };
  });
}

export async function updateUserAccessAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("roles.manage", async (actor) => {
    const fields = formToObject(formData);
    const target = await getUser(fields.id ?? "");
    if (!target) return { ok: false, message: "That account no longer exists." };
    if (!isRole(fields.role)) return { ok: false, message: "Choose a role.", errors: { role: "Choose a role." } };
    const next = { role: fields.role, active: fields.active === "on" };
    const problem = checkUserChange({ actorId: actor.id, target: { id: target.id, role: target.role, active: target.active }, next, activeSuperAdmins: await countActiveSuperAdmins() });
    if (problem) return { ok: false, message: problem };
    if (next.role === target.role && next.active === target.active) return { ok: true, message: "No changes." };
    await updateUserAccess(target.id, next);
    await writeAudit({
      actor,
      action: "user.update",
      entityType: "user",
      entityId: target.id,
      summary: `Account ${target.email}: ${next.role !== target.role ? `role ${target.role} -> ${next.role}` : ""}${next.role !== target.role && next.active !== target.active ? ", " : ""}${next.active !== target.active ? (next.active ? "reactivated" : "deactivated") : ""}`,
      meta: { fromRole: target.role, toRole: next.role, active: next.active },
    });
    revalidatePath("/admin/roles");
    return { ok: true, message: "Saved. The change applies on their next request." };
  });
}

export async function resetUserPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("roles.manage", async (actor) => {
    const fields = formToObject(formData);
    const target = await getUser(fields.id ?? "");
    if (!target) return { ok: false, message: "That account no longer exists." };
    const password = fields.password ?? "";
    const problem = checkPassword(password, { email: target.email, name: target.name });
    if (problem) return { ok: false, message: problem, errors: { password: problem } };
    await setUserPassword(target.id, await hashPassword(password), true);
    await writeAudit({ actor, action: "user.reset_password", entityType: "user", entityId: target.id, summary: `Temporary password set for ${target.email}` });
    revalidatePath("/admin/roles");
    return { ok: true, message: "Temporary password set. They must change it at next sign-in." };
  });
}
