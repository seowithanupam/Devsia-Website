"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/admin/action-state";
import { formToObject } from "@/lib/admin/form-data";
import { runAction } from "@/lib/auth/guard";
import { changedKeys, summarizeChange } from "@/lib/cms/audit";
import { writeAudit } from "@/lib/cms/repo/audit";
import { getSettingsRecord, saveSettingsRecord } from "@/lib/cms/repo/content";
import { DEFAULT_SETTINGS_RECORD, validateSettingsInput } from "@/lib/cms/settings";

export async function saveSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("settings.manage", async (user) => {
    const validation = validateSettingsInput(formToObject(formData));
    if (!validation.ok) return { ok: false, message: "Some fields need attention. Nothing was saved.", errors: validation.errors };
    const before = { ...DEFAULT_SETTINGS_RECORD, ...((await getSettingsRecord()) ?? {}) };
    await saveSettingsRecord(validation.value, user.email);
    // Only field NAMES go in the log: contact details are not copied into the audit trail.
    const changed = changedKeys(before, validation.value);
    await writeAudit({ actor: user, action: "settings.update", entityType: "settings", entityId: "main", summary: summarizeChange("Settings", changed), meta: { fields: changed } });
    revalidatePath("/", "layout");
    return { ok: true, message: "Settings saved. Phone numbers, address and links update across the site now." };
  });
}
