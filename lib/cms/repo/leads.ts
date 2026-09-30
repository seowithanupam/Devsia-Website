import "server-only";
import { getDb } from "@/lib/db";
import { LeadModel, type LeadDoc } from "@/lib/db/models";
import { escapeRegex } from "@/lib/cms/validate";
import type { LeadMirrorEntry } from "@/lib/forms/mirror";
import type { LeadKind, LeadRecord } from "@/lib/cms/types";

const isObjectId = (id: string) => /^[a-f0-9]{24}$/i.test(id);

function toRecord(doc: LeadDoc): LeadRecord {
  return {
    id: String(doc._id),
    kind: doc.kind,
    name: doc.name,
    phone: doc.phone,
    payload: JSON.parse(JSON.stringify(doc.payload ?? {})) as Record<string, unknown>,
    pageEnquired: doc.pageEnquired ?? "",
    source: doc.source ?? "Website",
    crmStatus: doc.crmStatus,
    receivedAt: doc.receivedAt.toISOString(),
  };
}

/**
 * Saves one mirror copy. `crmStatus` is "not_integrated" because PropDesk is not connected: nothing has
 * reached a CRM. Staff can see this in the leads list, so nobody assumes these were delivered.
 */
export async function recordLead(entry: LeadMirrorEntry): Promise<void> {
  await getDb();
  await LeadModel.create({ ...entry, source: "Website", crmStatus: "not_integrated", receivedAt: new Date() });
}

export async function listLeads({ kind, q, page, pageSize }: { kind?: LeadKind; q?: string; page: number; pageSize: number }) {
  await getDb();
  const filter: Record<string, unknown> = {};
  if (kind) filter.kind = kind;
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: "i" };
    filter.$or = [{ name: rx }, { phone: rx }, { pageEnquired: rx }];
  }
  const [total, docs] = await Promise.all([
    LeadModel.countDocuments(filter),
    LeadModel.find(filter).sort({ receivedAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean<LeadDoc[]>(),
  ]);
  return { total, items: docs.map(toRecord) };
}

export async function getLead(id: string): Promise<LeadRecord | null> {
  await getDb();
  if (!isObjectId(id)) return null;
  const doc = await LeadModel.findById(id).lean<LeadDoc>();
  return doc ? toRecord(doc) : null;
}

/** Submissions received in the last `days` days. The clock is read here, in the data layer, not while a page renders. */
export async function leadCountLastDays(days: number): Promise<number> {
  await getDb();
  const since = new Date(Date.now() - days * 86_400_000);
  return LeadModel.countDocuments({ receivedAt: { $gte: since } });
}
