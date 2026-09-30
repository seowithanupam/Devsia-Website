"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/admin/action-state";
import { formToObject } from "@/lib/admin/form-data";
import { runAction } from "@/lib/auth/guard";
import { MAX_UPLOAD_BYTES, safeFilename, sniffImageType } from "@/lib/cms/media";
import { writeAudit } from "@/lib/cms/repo/audit";
import { createMedia, deleteMediaRecord, getMedia, updateMediaAlt } from "@/lib/cms/repo/media";
import { cleanSingleLine } from "@/lib/cms/validate";
import { isBlobConfigured } from "@/lib/env";

/**
 * Uploads one image to Vercel Blob. Nothing is uploaded unless BLOB_READ_WRITE_TOKEN is set. The file type is
 * decided from the file's own bytes (not its name), SVG is refused, and the size is capped.
 */
export async function uploadMediaAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("media.manage", async (user) => {
    if (!isBlobConfigured()) return { ok: false, message: "Uploads are switched off because BLOB_READ_WRITE_TOKEN is not set." };
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose an image to upload.", errors: { file: "Choose an image." } };
    if (file.size > MAX_UPLOAD_BYTES) return { ok: false, message: `The image is too large. The limit is ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`, errors: { file: "Too large." } };

    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = sniffImageType(bytes);
    if (!kind) return { ok: false, message: "That file is not a JPEG, PNG, GIF, WebP or AVIF image.", errors: { file: "Unsupported file." } };

    const alt = cleanSingleLine(formData.get("alt"), 160);
    const filename = safeFilename(file.name, kind.ext);
    const { put } = await import("@vercel/blob");
    const blob = await put(`media/${filename}`, new Blob([bytes], { type: kind.contentType }), { access: "public", addRandomSuffix: true, contentType: kind.contentType });

    const record = await createMedia({ url: blob.url, pathname: blob.pathname, filename, contentType: kind.contentType, size: bytes.byteLength, alt, uploadedBy: user.email });
    await writeAudit({ actor: user, action: "media.upload", entityType: "media", entityId: record.id, summary: `Image uploaded: ${filename}`, meta: { size: record.size, type: kind.contentType } });
    revalidatePath("/admin/media");
    return { ok: true, message: `Uploaded ${filename}.` };
  });
}

export async function updateMediaAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("media.manage", async (user) => {
    const fields = formToObject(formData);
    const media = await getMedia(fields.id ?? "");
    if (!media) return { ok: false, message: "That image no longer exists." };
    await updateMediaAlt(media.id, cleanSingleLine(fields.alt, 160));
    await writeAudit({ actor: user, action: "media.update", entityType: "media", entityId: media.id, summary: `Image description changed: ${media.filename}` });
    revalidatePath("/admin/media");
    return { ok: true, message: "Saved." };
  });
}

export async function deleteMediaAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAction("media.manage", async (user) => {
    const media = await getMedia(formToObject(formData).id ?? "");
    if (!media) return { ok: false, message: "That image no longer exists." };
    if (isBlobConfigured()) {
      const { del } = await import("@vercel/blob");
      await del(media.url);
    }
    await deleteMediaRecord(media.id);
    await writeAudit({ actor: user, action: "media.delete", entityType: "media", entityId: media.id, summary: `Image deleted: ${media.filename}`, meta: { note: "Pages that still use this address will show a broken image." } });
    revalidatePath("/admin/media");
    return { ok: true, message: "Image deleted. Any page still using it will show a broken image until edited." };
  });
}
