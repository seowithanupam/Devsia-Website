import { describe, expect, it } from "vitest";
import { RETRY_AFTER_MS, shouldSkipAttempt } from "@/lib/db-utils/circuit";

describe("database outage pause", () => {
  const t0 = 1_000_000;
  it("never skips when nothing has failed", () => {
    expect(shouldSkipAttempt(null, t0)).toBe(false);
  });
  it("skips attempts right after a failure, so pages do not wait for a fresh timeout each time", () => {
    expect(shouldSkipAttempt(t0, t0)).toBe(true);
    expect(shouldSkipAttempt(t0, t0 + RETRY_AFTER_MS - 1)).toBe(true);
  });
  it("tries again once the pause is over", () => {
    expect(shouldSkipAttempt(t0, t0 + RETRY_AFTER_MS)).toBe(false);
    expect(shouldSkipAttempt(t0, t0 + 10 * RETRY_AFTER_MS)).toBe(false);
  });
  it("uses a pause shorter than a minute and longer than one page render", () => {
    expect(RETRY_AFTER_MS).toBeGreaterThanOrEqual(5_000);
    expect(RETRY_AFTER_MS).toBeLessThanOrEqual(60_000);
  });
});
