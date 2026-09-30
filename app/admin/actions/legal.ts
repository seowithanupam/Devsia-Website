"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/admin/action-state";
import { formToObject } from "@/lib/admin/form-data";
import { runAction } from "@/lib/auth/guard";
import { changedKeys, summarizeChange } from "@/lib/cms/audit";
import { isLegalSlug, validateLegalInput } from "@/lib/cms/legal";
import { writeAudit } from "@/lib/cms/repo/audit";
import { getLegalRecord, saveLegalRecord } from "@/lib/cms/repo/content";

export async function saveLegalAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("pages.manage", async (user) => {
    const fields = formToObject(formData);
    if (!isLegalSlug(fields.slug)) return { ok: false, message: "Unknown legal document." };
    const validation = validateLegalInput(fields);
    if (!validation.ok) return { ok: false, message: "Some fields need attention. Nothing was saved.", errors: validation.errors };
    const before = await getLegalRecord(fields.slug);
    await saveLegalRecord(fields.slug, validation.value, user.email);
    const changed = changedKeys((before ?? {}) as unknown as Record<string, unknown>, validation.value, ["navLabel", "title", "lastUpdated", "intro", "body"]);
    await writeAudit({ actor: user, action: "legal.update", entityType: "legal", entityId: fields.slug, summary: summarizeChange(`Legal ${fields.slug}`, changed), meta: { fields: changed } });
    revalidatePath("/", "layout");
    return { ok: true, message: "Saved. The public /legal page is updated." };
  });
}
