import "server-only";
import { afterIpFailure, expiryFor, isIpBlocked, type IpState } from "@/lib/auth/ip-throttle";
import { getDb } from "@/lib/db";
import { LoginAttemptModel } from "@/lib/db/models";

async function read(key: string): Promise<IpState | null> {
  const doc = await LoginAttemptModel.findOne({ key }).lean<{ count: number; windowStart: Date }>();
  return doc ? { count: doc.count, windowStart: doc.windowStart } : null;
}

/** Has this address used up its failed sign-ins for the current window? */
export async function isNetworkBlocked(key: string, now: Date): Promise<boolean> {
  await getDb();
  return isIpBlocked(await read(key), now);
}

/**
 * Counts one failed sign-in for this address. `justBlocked` is true only for the failure that reaches the limit,
 * so the audit log gets one entry per block, not one per attempt. Counting is best effort (two attempts at the very same moment can be counted once).
 */
export async function recordNetworkFailure(key: string, now: Date): Promise<{ justBlocked: boolean }> {
  await getDb();
  const { state, justBlocked } = afterIpFailure(await read(key), now);
  await LoginAttemptModel.updateOne({ key }, { $set: { count: state.count, windowStart: state.windowStart, expiresAt: expiryFor(state.windowStart) } }, { upsert: true });
  return { justBlocked };
}
