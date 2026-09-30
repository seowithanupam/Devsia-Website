import "server-only";
import { MODELS_BY_NAME } from "@/lib/db/models";
import { EXPECTED_INDEXES } from "./expected-indexes.mjs";

export type IndexReport = { created: string[]; failed: Array<{ index: string; reason: string }> };

const describe = (collection: string, keys: Record<string, number>) => `${collection}(${Object.entries(keys).map(([k, v]) => `${k}:${v}`).join(",")})`;

/** The indexes a collection already has (none if the collection does not exist yet). */
async function existing(model: (typeof MODELS_BY_NAME)[keyof typeof MODELS_BY_NAME]): Promise<Array<{ key: Record<string, number>; unique?: boolean }>> {
  try {
    return (await model.collection.indexes()) as Array<{ key: Record<string, number>; unique?: boolean }>;
  } catch {
    return [];
  }
}

const sameKeys = (a: Record<string, number>, b: Record<string, number>) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Makes sure the indexes in expected-indexes.mjs exist. It only ever calls createIndex, which adds an index and
 * changes NO data; it never drops or rebuilds anything. If an index cannot be built (for example duplicate
 * emails already exist, or an index with different options is already there) it is logged and skipped, and the app carries on.
 * Safe to run on every start: an index that already exists is left alone.
 *
 * Why this exists: with `bufferCommands: false`, Mongoose can skip building the indexes declared in the schemas
 * when a model is loaded before the connection is open, so they are created here, once the connection is open.
 */
export async function ensureIndexes(): Promise<IndexReport> {
  const report: IndexReport = { created: [], failed: [] };
  for (const spec of EXPECTED_INDEXES) {
    const model = MODELS_BY_NAME[spec.model as keyof typeof MODELS_BY_NAME];
    const label = describe(model.collection.name, spec.keys);
    try {
      const already = (await existing(model)).some((i) => sameKeys(i.key, spec.keys) && Boolean(i.unique) === Boolean(spec.unique));
      if (already) continue;
      await model.collection.createIndex(spec.keys, {
        ...(spec.unique ? { unique: true } : {}),
        ...(spec.expireAfterSeconds !== undefined ? { expireAfterSeconds: spec.expireAfterSeconds } : {}),
      });
      report.created.push(label);
    } catch (error) {
      const code = (error as { code?: unknown } | null)?.code;
      const reason = code === 11000 ? "duplicate values already exist, so a unique index cannot be built (no data was changed)" : code === 85 || code === 86 ? "an index on the same fields with different options already exists (left as it is)" : error instanceof Error ? error.message : "unknown error";
      report.failed.push({ index: label, reason });
    }
  }
  if (report.created.length > 0) console.info(`[indexes] created: ${report.created.join(", ")}`);
  for (const f of report.failed) console.error(`[indexes] could not create ${f.index}: ${f.reason}`);
  return report;
}
