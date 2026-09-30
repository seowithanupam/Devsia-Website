"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import type { ActionState } from "@/lib/admin/action-state";
import { formToObject } from "@/lib/admin/form-data";
import { runAction } from "@/lib/auth/guard";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { checkPassword } from "@/lib/auth/password-policy";
import { writeAudit } from "@/lib/cms/repo/audit";
import { findUserWithSecretById, setUserPassword, updateUserName } from "@/lib/cms/repo/users";
import { cleanSingleLine } from "@/lib/cms/validate";

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(
    null,
    async (user) => {
      const name = cleanSingleLine(formToObject(formData).name, 80);
      if (!name) return { ok: false, message: "Enter your name.", errors: { name: "Enter your name." } };
      await updateUserName(user.id, name);
      await writeAudit({ actor: user, action: "profile.update", entityType: "user", entityId: user.id, summary: "Profile name changed" });
      revalidatePath("/admin", "layout");
      return { ok: true, message: "Saved." };
    },
    { allowPasswordChange: true },
  );
}

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction(
    null,
    // The explicit return type makes TypeScript check each return on its own. Without it, the three different
    // `errors: { ... }` shapes below are merged into one union with `key?: undefined` members, which is not a Record<string, string>.
    async (user): Promise<ActionState> => {
      const fields = formToObject(formData);
      const current = fields.currentPassword ?? "";
      const next = fields.newPassword ?? "";
      const confirm = fields.confirmPassword ?? "";
      const record = await findUserWithSecretById(user.id);
      if (!record || !(await verifyPassword(current, record.passwordHash))) {
        return { ok: false, message: "Your current password is not right.", errors: { currentPassword: "Not right." } };
      }
      const problem = checkPassword(next, { email: user.email, name: user.name });
      if (problem) return { ok: false, message: problem, errors: { newPassword: problem } };
      if (next !== confirm) return { ok: false, message: "The two new passwords do not match.", errors: { confirmPassword: "Does not match." } };
      if (await verifyPassword(next, record.passwordHash)) return { ok: false, message: "Choose a password you have not used just now.", errors: { newPassword: "Must be different." } };
      await setUserPassword(user.id, await hashPassword(next), false);
      await writeAudit({ actor: user, action: "profile.password_change", entityType: "user", entityId: user.id, summary: "Password changed" });
      // The password change raised the session version, so every session (this browser's included) is now out of date.
      // Clear this browser's cookie and send the person to sign in with the new password.
      await signOut({ redirect: false });
      return redirect("/admin/login?changed=1");
    },
    { allowPasswordChange: true },
  );
}
