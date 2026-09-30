"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/admin/action-state";
import { formToObject } from "@/lib/admin/form-data";
import { runAction } from "@/lib/auth/guard";
import { PAGE_DEFS, isPageSlug } from "@/lib/cms/blocks";
import { changedKeys, summarizeChange } from "@/lib/cms/audit";
import { validateSeoInput, validateSeoTemplateInput } from "@/lib/cms/seo";
import { writeAudit } from "@/lib/cms/repo/audit";
import { deletePropertySeoOverride, getPage, getPropertySeoOverride, getSeoTemplate, savePageSeo, savePropertySeoOverride, saveSeoTemplate } from "@/lib/cms/repo/content";
import { isValidSlug } from "@/lib/cms/validate";
import { getPropertyProvider } from "@/lib/services";

export async function savePageSeoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("seo.manage", async (user) => {
    const fields = formToObject(formData);
    const slug = fields.slug;
    if (!isPageSlug(slug)) return { ok: false, message: "Unknown page." };
    const validation = validateSeoInput(fields);
    if (!validation.ok) return { ok: false, message: "Some fields need attention. Nothing was saved.", errors: validation.errors };
    const before = (await getPage(slug))?.seo ?? {};
    await savePageSeo(slug, PAGE_DEFS[slug].title, validation.value, user.email);
    const changed = changedKeys(before as Record<string, unknown>, validation.value as Record<string, unknown>, ["title", "description", "canonical", "ogTitle", "ogDescription", "ogImage", "noIndex", "noFollow"]);
    await writeAudit({ actor: user, action: "seo.page.update", entityType: "page", entityId: slug, summary: summarizeChange(`SEO for ${slug}`, changed), meta: { fields: changed } });
    revalidatePath("/", "layout");
    return { ok: true, message: "SEO saved." };
  });
}

export async function saveSeoTemplateAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("seo.manage", async (user) => {
    const validation = validateSeoTemplateInput(formToObject(formData));
    if (!validation.ok) return { ok: false, message: "Some fields need attention. Nothing was saved.", errors: validation.errors };
    const before = (await getSeoTemplate()) ?? {};
    await saveSeoTemplate(validation.value, user.email);
    const changed = changedKeys(before as Record<string, unknown>, validation.value);
    await writeAudit({ actor: user, action: "seo.template.update", entityType: "seo_template", entityId: "property", summary: summarizeChange("Property SEO template", changed), meta: { fields: changed } });
    revalidatePath("/", "layout");
    return { ok: true, message: "The property SEO template was saved." };
  });
}

export async function savePropertySeoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("seo.manage", async (user) => {
    const fields = formToObject(formData);
    const slug = fields.slug ?? "";
    if (!isValidSlug(slug)) return { ok: false, message: "Unknown listing." };
    // Overrides are only for listings that exist right now (the listing itself belongs to the property provider).
    if (!(await getPropertyProvider().getProperty(slug))) return { ok: false, message: "That listing is not in the current inventory." };
    const validation = validateSeoInput(fields);
    if (!validation.ok) return { ok: false, message: "Some fields need attention. Nothing was saved.", errors: validation.errors };
    const before = (await getPropertySeoOverride(slug))?.seo ?? {};
    await savePropertySeoOverride(slug, validation.value, user.email);
    const changed = changedKeys(before as Record<string, unknown>, validation.value as Record<string, unknown>, ["title", "description", "canonical", "ogTitle", "ogDescription", "ogImage", "noIndex", "noFollow"]);
    await writeAudit({ actor: user, action: "seo.property.update", entityType: "property_seo", entityId: slug, summary: summarizeChange(`SEO override for ${slug}`, changed), meta: { fields: changed } });
    revalidatePath(`/properties/${slug}`);
    return { ok: true, message: "The listing SEO override was saved." };
  });
}

export async function deletePropertySeoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("seo.manage", async (user) => {
    const slug = formToObject(formData).slug ?? "";
    if (!isValidSlug(slug)) return { ok: false, message: "Unknown listing." };
    await deletePropertySeoOverride(slug);
    await writeAudit({ actor: user, action: "seo.property.delete", entityType: "property_seo", entityId: slug, summary: `SEO override removed for ${slug}` });
    revalidatePath(`/properties/${slug}`);
    return { ok: true, message: "The override was removed. This listing now uses the template." };
  });
}
