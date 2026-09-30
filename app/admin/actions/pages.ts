"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/admin/action-state";
import { formToObject, parseJsonField } from "@/lib/admin/form-data";
import { PAGE_DEFS, isPageSlug, validatePageBlocks, type StoredBlock } from "@/lib/cms/blocks";
import { changedKeys, summarizeChange } from "@/lib/cms/audit";
import { getPage, resetPageBlocks, savePageBlocks } from "@/lib/cms/repo/content";
import { writeAudit } from "@/lib/cms/repo/audit";
import { runAction } from "@/lib/auth/guard";

function done(slug: string) {
  revalidatePath("/", "layout");
  revalidatePath(`/admin/pages/${slug}`);
}

export async function savePageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("pages.manage", async (user) => {
    const fields = formToObject(formData);
    const slug = fields.slug;
    if (!isPageSlug(slug)) return { ok: false, message: "Unknown page." };
    const validation = validatePageBlocks(slug, parseJsonField(fields.blocks));
    if (!validation.ok) return { ok: false, message: "Some fields need attention. Nothing was saved.", errors: validation.errors };

    const before = await getPage(slug);
    await savePageBlocks(slug, PAGE_DEFS[slug].title, validation.blocks, user.email);
    const changed = changedKeys(
      Object.fromEntries((before?.blocks ?? []).map((b) => [b.type, b])),
      Object.fromEntries(validation.blocks.map((b) => [b.type, b])),
    );
    await writeAudit({ actor: user, action: "page.update", entityType: "page", entityId: slug, summary: summarizeChange(`Page ${slug}`, changed), meta: { blocks: changed } });
    done(slug);
    return { ok: true, message: "Page saved. It is live now." };
  });
}

export async function resetPageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("pages.manage", async (user) => {
    const slug = formToObject(formData).slug;
    if (!isPageSlug(slug)) return { ok: false, message: "Unknown page." };
    const blocks: StoredBlock[] = PAGE_DEFS[slug].defaults().map((b, order) => ({ type: b.type, order, enabled: true, data: b.data }));
    await resetPageBlocks(slug, PAGE_DEFS[slug].title, blocks, user.email);
    await writeAudit({ actor: user, action: "page.reset", entityType: "page", entityId: slug, summary: `Page ${slug}: reset to the built-in content` });
    done(slug);
    return { ok: true, message: "The page was reset to the built-in content." };
  });
}
