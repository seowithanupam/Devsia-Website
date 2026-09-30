import { describe, expect, it } from "vitest";
import { MAX_FAILURES_PER_IP, WINDOW_MINUTES, afterIpFailure, clientIpFromHeaders, expiryFor, ipKey, isIpBlocked, type IpState } from "@/lib/auth/ip-throttle";
import { isSessionCurrent } from "@/lib/auth/session-version";

describe("per-network sign-in throttle", () => {
  const t0 = new Date("2026-09-30T10:00:00Z");
  const minutes = (n: number) => new Date(t0.getTime() + n * 60_000);

  it("does not block an address with no failures", () => {
    expect(isIpBlocked(null, t0)).toBe(false);
  });

  it("blocks on the failure that reaches the limit, and reports that moment once", () => {
    let state: IpState | null = null;
    const justBlocked: boolean[] = [];
    for (let i = 1; i <= MAX_FAILURES_PER_IP + 3; i++) {
      const next = afterIpFailure(state, t0);
      state = next.state;
      justBlocked.push(next.justBlocked);
      expect(isIpBlocked(state, t0)).toBe(i >= MAX_FAILURES_PER_IP);
    }
    expect(justBlocked.filter(Boolean)).toHaveLength(1);
    expect(justBlocked.indexOf(true)).toBe(MAX_FAILURES_PER_IP - 1);
  });

  it("lets the address in again when the window is over, and starts counting from one", () => {
    const blocked: IpState = { count: MAX_FAILURES_PER_IP, windowStart: t0 };
    expect(isIpBlocked(blocked, minutes(WINDOW_MINUTES - 1))).toBe(true);
    expect(isIpBlocked(blocked, minutes(WINDOW_MINUTES))).toBe(false);
    const next = afterIpFailure(blocked, minutes(WINDOW_MINUTES + 1));
    expect(next.state.count).toBe(1);
    expect(next.justBlocked).toBe(false);
  });

  it("expires the stored counter when its window ends", () => {
    expect(expiryFor(t0).getTime() - t0.getTime()).toBe(WINDOW_MINUTES * 60_000);
  });

  it("takes the client address from the platform's forwarding header, first entry", () => {
    const headers: Record<string, string> = { "x-forwarded-for": "203.0.113.7, 10.0.0.1", "x-real-ip": "198.51.100.2" };
    expect(clientIpFromHeaders((n) => headers[n] ?? null)).toBe("203.0.113.7");
    expect(clientIpFromHeaders((n) => ({ "x-real-ip": "198.51.100.2" } as Record<string, string>)[n] ?? null)).toBe("198.51.100.2");
    expect(clientIpFromHeaders((n) => ({ "x-forwarded-for": "2001:db8::1" } as Record<string, string>)[n] ?? null)).toBe("2001:db8::1");
  });

  it("falls back to one shared bucket for missing or nonsense values", () => {
    expect(clientIpFromHeaders(() => null)).toBe("unknown");
    expect(clientIpFromHeaders((n) => ({ "x-forwarded-for": "<script>" } as Record<string, string>)[n] ?? null)).toBe("unknown");
  });

  it("stores only a keyed hash, different for each address and each secret", () => {
    const a = ipKey("203.0.113.7", "secret-one");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain("203.0.113.7");
    expect(ipKey("203.0.113.8", "secret-one")).not.toBe(a);
    expect(ipKey("203.0.113.7", "secret-two")).not.toBe(a);
    expect(ipKey("203.0.113.7", "secret-one")).toBe(a);
  });
});

describe("session version (password change ends older sessions)", () => {
  it("accepts a session whose version matches", () => {
    expect(isSessionCurrent(2, 2)).toBe(true);
  });
  it("rejects a session issued before a password change", () => {
    expect(isSessionCurrent(0, 1)).toBe(false);
    expect(isSessionCurrent(1, 2)).toBe(false);
  });
  it("rejects a token claiming a newer version than the database", () => {
    expect(isSessionCurrent(5, 1)).toBe(false);
  });
  it("counts sessions from before the feature (no version) as version 0, so the upgrade signs nobody out", () => {
    expect(isSessionCurrent(undefined, 0)).toBe(true);
    expect(isSessionCurrent(null, undefined)).toBe(true);
    expect(isSessionCurrent(undefined, 1)).toBe(false);
  });
});
