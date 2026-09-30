import { createHmac } from "node:crypto";

/**
 * Per-network sign-in throttling.
 *
 * PROPOSAL: the handover mentions no login throttling. This limits FAILED sign-ins per client address, on top of
 * the per-account lockout in lockout.ts, so one address cannot try passwords against many accounts. Counters
 * live in MongoDB (no extra service) and expire on their own. Addresses are stored only as a keyed hash.
 *
 * Limits: after MAX_FAILURES_PER_IP failed sign-ins within WINDOW_MINUTES, that address is refused until the window ends.
 * It is a best-effort layer: behind a proxy that does not set a trustworthy X-Forwarded-For (Vercel does) it can be evaded,
 * and the per-account lockout still applies.
 */
export const MAX_FAILURES_PER_IP = 20;
export const WINDOW_MINUTES = 15;

export type IpState = { count: number; windowStart: Date };

function windowOver(state: IpState, now: Date): boolean {
  return now.getTime() - state.windowStart.getTime() >= WINDOW_MINUTES * 60_000;
}

/** True when this address has used up its failures for the current window. */
export function isIpBlocked(state: IpState | null, now: Date): boolean {
  return state !== null && !windowOver(state, now) && state.count >= MAX_FAILURES_PER_IP;
}

/** State after one more failed sign-in. A finished window starts a fresh count. `justBlocked` is true only on the failure that hits the limit. */
export function afterIpFailure(state: IpState | null, now: Date): { state: IpState; justBlocked: boolean } {
  const fresh = state === null || windowOver(state, now);
  const count = (fresh ? 0 : state.count) + 1;
  return { state: { count, windowStart: fresh ? now : state.windowStart }, justBlocked: count === MAX_FAILURES_PER_IP };
}

/** When the stored counter can be deleted by MongoDB's expiry index. */
export function expiryFor(windowStart: Date): Date {
  return new Date(windowStart.getTime() + WINDOW_MINUTES * 60_000);
}

/**
 * The visitor's address from request headers. X-Forwarded-For (first entry) is set by the hosting platform;
 * on Vercel it cannot be forged by the client. Falls back to X-Real-IP, then to "unknown" (a single shared bucket, as in local development).
 */
export function clientIpFromHeaders(get: (name: string) => string | null | undefined): string {
  const forwarded = get("x-forwarded-for")?.split(",")[0]?.trim();
  const candidate = forwarded || get("x-real-ip")?.trim() || "";
  return /^[0-9a-fA-F:.]{2,45}$/.test(candidate) ? candidate : "unknown";
}

/** Keyed hash of the address, so raw addresses are never stored. */
export function ipKey(ip: string, secret: string): string {
  return createHmac("sha256", secret).update(ip).digest("hex");
}
