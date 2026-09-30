"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/admin/action-state";
import { runAction } from "@/lib/auth/guard";
import { writeAudit } from "@/lib/cms/repo/audit";
import { restoreMissingDefaults } from "@/lib/cms/repo/seed-content";

/** Super admin only. Adds back any built-in page, article, legal text or setting that is missing; never overwrites edits. */
export async function restoreDefaultsAction(): Promise<ActionState> {
  return runAction("settings.manage", async (user) => {
    const report = await restoreMissingDefaults();
    await writeAudit({ actor: user, action: "content.seed", entityType: "content", summary: "Restored missing built-in content", meta: { ...report } });
    revalidatePath("/", "layout");
    const total = Object.values(report).reduce((a, b) => a + b, 0);
    return { ok: true, message: total === 0 ? "Nothing was missing." : `Restored ${total} missing item${total === 1 ? "" : "s"}.` };
  });
}
