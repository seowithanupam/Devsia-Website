import "server-only";
import { getDb } from "@/lib/db";
import { MediaModel, type MediaDoc } from "@/lib/db/models";
import type { MediaRecord } from "@/lib/cms/types";

const isObjectId = (id: string) => /^[a-f0-9]{24}$/i.test(id);

function toRecord(doc: MediaDoc): MediaRecord {
  return {
    id: String(doc._id),
    url: doc.url,
    pathname: doc.pathname,
    filename: doc.filename,
    contentType: doc.contentType,
    size: doc.size,
    alt: doc.alt ?? "",
    uploadedBy: doc.uploadedBy,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function listMedia(limit = 200): Promise<MediaRecord[]> {
  await getDb();
  return (await MediaModel.find({}).sort({ createdAt: -1 }).limit(limit).lean<MediaDoc[]>()).map(toRecord);
}

export async function getMedia(id: string): Promise<MediaRecord | null> {
  await getDb();
  if (!isObjectId(id)) return null;
  const doc = await MediaModel.findById(id).lean<MediaDoc>();
  return doc ? toRecord(doc) : null;
}

export async function createMedia(input: Omit<MediaRecord, "id" | "createdAt">): Promise<MediaRecord> {
  await getDb();
  const doc = await MediaModel.create(input);
  return toRecord(doc.toObject() as MediaDoc);
}

export async function updateMediaAlt(id: string, alt: string): Promise<void> {
  await getDb();
  if (isObjectId(id)) await MediaModel.updateOne({ _id: id }, { $set: { alt } });
}

export async function deleteMediaRecord(id: string): Promise<void> {
  await getDb();
  if (isObjectId(id)) await MediaModel.deleteOne({ _id: id });
}
