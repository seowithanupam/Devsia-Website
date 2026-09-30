"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/admin/action-state";
import { formToObject, parseJsonField } from "@/lib/admin/form-data";
import { runAction } from "@/lib/auth/guard";
import { changedKeys, summarizeChange } from "@/lib/cms/audit";
import { navigationFromRecord, validateNavigationInput } from "@/lib/cms/nav";
import { writeAudit } from "@/lib/cms/repo/audit";
import { getNavigationRecord, saveNavigationRecord } from "@/lib/cms/repo/content";

export async function saveNavigationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("nav.manage", async (user) => {
    const validation = validateNavigationInput(parseJsonField(formToObject(formData).payload));
    if (!validation.ok) return { ok: false, message: "Some links need attention. Nothing was saved.", errors: validation.errors };
    const before = navigationFromRecord(await getNavigationRecord());
    await saveNavigationRecord(validation.value, user.email);
    const changed = changedKeys(before as unknown as Record<string, unknown>, validation.value as unknown as Record<string, unknown>);
    await writeAudit({ actor: user, action: "nav.update", entityType: "navigation", entityId: "main", summary: summarizeChange("Navigation", changed), meta: { parts: changed } });
    revalidatePath("/", "layout");
    return { ok: true, message: "Navigation saved. It is live now." };
  });
}
