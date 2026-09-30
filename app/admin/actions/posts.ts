"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/admin/action-state";
import { formToObject } from "@/lib/admin/form-data";
import { runAction } from "@/lib/auth/guard";
import { changedKeys, summarizeChange } from "@/lib/cms/audit";
import { validatePostInput } from "@/lib/cms/posts";
import { writeAudit } from "@/lib/cms/repo/audit";
import { createPost, deletePost, getPost, slugTaken, updatePost } from "@/lib/cms/repo/posts";
import type { PostStatus } from "@/lib/cms/types";

function refresh() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/blogs");
}

/** intent: "save" keeps the current status; "publish" and "unpublish" change it. */
export async function savePostAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("blogs.manage", async (user) => {
    const fields = formToObject(formData);
    const id = fields.id ?? "";
    const intent = fields.intent === "publish" || fields.intent === "unpublish" ? fields.intent : "save";

    const validation = validatePostInput(fields);
    if (!validation.ok) return { ok: false, message: "Some fields need attention. Nothing was saved.", errors: validation.errors };
    const input = validation.value;

    const existing = id ? await getPost(id) : null;
    if (id && !existing) return { ok: false, message: "That post no longer exists." };
    if (await slugTaken(input.slug, existing?.id)) return { ok: false, message: "Another post already uses that address.", errors: { slug: "Choose a different address (slug)." } };

    const now = new Date();
    const chosenDate = input.publishedDate ? new Date(`${input.publishedDate}T00:00:00.000Z`) : null;
    const existingDate = existing?.publishedAt ? new Date(existing.publishedAt) : null;

    let status: PostStatus = existing?.status ?? "draft";
    if (intent === "publish") status = "published";
    if (intent === "unpublish") status = "draft";
    // A published post always has a date. A draft keeps whatever date it had.
    const publishedAt = chosenDate ?? existingDate ?? (status === "published" ? now : null);

    if (!existing) {
      const created = await createPost(input, publishedAt, status, user.email);
      await writeAudit({ actor: user, action: "post.create", entityType: "post", entityId: created.id, summary: `Post created: ${created.slug}`, meta: { status } });
      if (status === "published") await writeAudit({ actor: user, action: "post.publish", entityType: "post", entityId: created.id, summary: `Post published: ${created.slug}` });
      refresh();
      redirect(`/admin/blogs/${created.id}?saved=1`);
    }

    const updated = await updatePost(existing.id, input, { status, publishedAt }, user.email);
    if (!updated) return { ok: false, message: "That post no longer exists." };
    const changed = changedKeys(
      { ...existing, seo: JSON.stringify(existing.seo) },
      { ...updated, seo: JSON.stringify(updated.seo) },
      ["title", "slug", "excerpt", "body", "category", "tags", "authorName", "authorRole", "coverUrl", "coverAlt", "coverCaption", "readMinutes", "featured", "placeholderBody", "seo"],
    );
    await writeAudit({ actor: user, action: "post.update", entityType: "post", entityId: updated.id, summary: summarizeChange(`Post ${updated.slug}`, changed), meta: { fields: changed } });
    if (existing.status !== updated.status) {
      await writeAudit({
        actor: user,
        action: updated.status === "published" ? "post.publish" : "post.unpublish",
        entityType: "post",
        entityId: updated.id,
        summary: `Post ${updated.status === "published" ? "published" : "unpublished"}: ${updated.slug}`,
      });
    }
    refresh();
    revalidatePath(`/admin/blogs/${updated.id}`);
    const label = intent === "publish" ? "Post published." : intent === "unpublish" ? "Post moved back to draft." : "Post saved.";
    return { ok: true, message: label };
  });
}

export async function deletePostAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("blogs.manage", async (user) => {
    const id = formToObject(formData).id ?? "";
    const post = await getPost(id);
    if (!post) return { ok: false, message: "That post no longer exists." };
    await deletePost(id);
    await writeAudit({ actor: user, action: "post.delete", entityType: "post", entityId: id, summary: `Post deleted: ${post.slug}`, meta: { wasPublished: post.status === "published" } });
    refresh();
    redirect("/admin/blogs?deleted=1");
  });
}
