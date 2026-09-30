import "server-only";
import { ensureSeedAdmin } from "@/lib/cms/repo/seed-admin";
import { seedDefaultContent } from "@/lib/cms/repo/seed-content";
import { ensureIndexes } from "./indexes";

/**
 * First-start setup, once per server process. Idempotent: safe to run on every cold start and from several
 * instances at once. Indexes first (so the unique ones also protect the seeding below), then the first admin, then the built-in content.
 */
export async function bootstrap(): Promise<void> {
  await ensureIndexes();
  await ensureSeedAdmin();
  await seedDefaultContent();
}
