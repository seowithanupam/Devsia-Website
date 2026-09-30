import "server-only";
import type { Role } from "@/lib/auth/capabilities";
import { getDb } from "@/lib/db";
import { AuditModel, type AuditDoc } from "@/lib/db/models";
import { escapeRegex } from "@/lib/cms/validate";
import type { AuditAction } from "@/lib/cms/audit";
import type { AuditRecord } from "@/lib/cms/types";

export type AuditActor = { id: string; email: string; role: Role } | null;

export type AuditEntry = {
  actor: AuditActor;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  summary: string;
  /** Small non-sensitive facts (field names, ids). Never put values, passwords or personal data here. */
  meta?: Record<string, unknown>;
};

/**
 * Writes one audit entry on an ALREADY OPEN connection. Used by the first-start setup, which itself runs inside
 * getDb(): calling getDb() from there would wait for itself. Never throws.
 */
export async function writeAuditDirect(entry: AuditEntry): Promise<void> {
  try {
    await AuditModel.create({
      actorId: entry.actor?.id ?? null,
      actorEmail: entry.actor?.email ?? "",
      actorRole: entry.actor?.role ?? "",
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? "",
      summary: entry.summary.slice(0, 300),
      meta: entry.meta ?? {},
      at: new Date(),
    });
  } catch (error) {
    console.error("[audit] could not write entry:", error instanceof Error ? error.message : "unknown error");
  }
}

/** Writes one audit entry. An audit failure is logged but never blocks the admin action that caused it. */
export async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    await getDb();
  } catch (error) {
    console.error("[audit] could not write entry:", error instanceof Error ? error.message : "unknown error");
    return;
  }
  await writeAuditDirect(entry);
}

function toRecord(doc: AuditDoc): AuditRecord {
  return {
    id: String(doc._id),
    actorId: doc.actorId,
    actorEmail: doc.actorEmail,
    actorRole: doc.actorRole,
    action: doc.action,
    entityType: doc.entityType,
    entityId: doc.entityId,
    summary: doc.summary,
    meta: doc.meta ?? {},
    at: doc.at.toISOString(),
  };
}

export async function listAudit({ action, q, page, pageSize }: { action?: string; q?: string; page: number; pageSize: number }) {
  await getDb();
  const filter: Record<string, unknown> = {};
  if (action) filter.action = { $regex: `^${escapeRegex(action)}` };
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: "i" };
    filter.$or = [{ actorEmail: rx }, { summary: rx }, { entityId: rx }];
  }
  const [total, docs] = await Promise.all([
    AuditModel.countDocuments(filter),
    AuditModel.find(filter).sort({ at: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean<AuditDoc[]>(),
  ]);
  return { total, items: docs.map(toRecord) };
}

export async function recentAudit(limit: number): Promise<AuditRecord[]> {
  await getDb();
  const docs = await AuditModel.find({}).sort({ at: -1 }).limit(limit).lean<AuditDoc[]>();
  return docs.map(toRecord);
}
