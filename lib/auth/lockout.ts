/**
 * Per-account sign-in lockout.
 * PROPOSAL: the handover mentions no lockout. Five wrong passwords lock the account for 15 minutes. This slows
 * password guessing. It is not a per-IP limit (that arrives with the caching phase).
 */
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

export type LockState = { failedAttempts: number; lockedUntil: Date | null };

export function isLocked(state: LockState, now: Date): boolean {
  return state.lockedUntil !== null && state.lockedUntil.getTime() > now.getTime();
}

/** State after one more wrong password. */
export function afterFailure(state: LockState, now: Date): LockState {
  // A finished lock starts a fresh count.
  const base = state.lockedUntil !== null && state.lockedUntil.getTime() <= now.getTime() ? 0 : state.failedAttempts;
  const failedAttempts = base + 1;
  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    return { failedAttempts, lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000) };
  }
  return { failedAttempts, lockedUntil: null };
}

export function afterSuccess(): LockState {
  return { failedAttempts: 0, lockedUntil: null };
}
