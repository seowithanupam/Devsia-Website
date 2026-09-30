import "server-only";
import { connectDb } from "./connection";

type BootState = { promise: Promise<void> | null };
declare global {
  var __devsiaBoot: BootState | undefined;
}
const boot: BootState = (globalThis.__devsiaBoot ??= { promise: null });

/**
 * Connects to MongoDB and, once per server process, runs the first-start setup: the seeded admin account
 * (only when there are no users yet) and the default site content (only into empty collections). Setup
 * problems are logged and retried on a later call; they never stop a page from rendering.
 */
export async function getDb(): Promise<void> {
  await connectDb();
  boot.promise ??= import("./bootstrap")
    .then((m) => m.bootstrap())
    .catch((error: unknown) => {
      boot.promise = null;
      console.error("[bootstrap] first-start setup failed:", error instanceof Error ? error.message : "unknown error");
    });
  await boot.promise;
}
