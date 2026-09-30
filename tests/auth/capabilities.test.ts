import { describe, expect, it } from "vitest";
import { CAPABILITIES, ROLES, can, capabilitiesOf, isRole } from "@/lib/auth/capabilities";
import { ADMIN_NAV, activeNavHref, visibleNav } from "@/lib/admin/nav";
import { checkPassword } from "@/lib/auth/password-policy";
import { LOCK_MINUTES, MAX_FAILED_ATTEMPTS, afterFailure, afterSuccess, isLocked } from "@/lib/auth/lockout";

describe("role capabilities (the documented matrix)", () => {
  it("gives super_admin every capability", () => {
    for (const c of CAPABILITIES) expect(can("super_admin", c)).toBe(true);
  });
  it("gives content_editor pages, blogs, nav, media and leads only", () => {
    expect([...capabilitiesOf("content_editor")].sort()).toEqual(["blogs.manage", "leads.view", "media.manage", "nav.manage", "pages.manage"]);
    for (const c of ["seo.manage", "settings.manage", "roles.manage", "audit.view"] as const) expect(can("content_editor", c)).toBe(false);
  });
  it("gives seo_manager SEO only", () => {
    expect([...capabilitiesOf("seo_manager")]).toEqual(["seo.manage"]);
    for (const c of CAPABILITIES.filter((x) => x !== "seo.manage")) expect(can("seo_manager", c)).toBe(false);
  });
  it("grants nothing to unknown or missing roles", () => {
    expect(can(null, "pages.manage")).toBe(false);
    expect(can(undefined, "pages.manage")).toBe(false);
    expect(can("owner" as never, "pages.manage")).toBe(false);
  });
  it("only super_admin manages roles", () => {
    expect(ROLES.filter((r) => can(r, "roles.manage"))).toEqual(["super_admin"]);
  });
  it("recognises the three role names", () => {
    expect(isRole("super_admin") && isRole("content_editor") && isRole("seo_manager")).toBe(true);
    expect(isRole("admin")).toBe(false);
  });
});

describe("admin navigation", () => {
  it("lists the 12 screens of the handover", () => {
    expect(ADMIN_NAV).toHaveLength(12);
  });
  it("shows each role only its own screens", () => {
    expect(visibleNav("seo_manager").map((i) => i.label)).toEqual(["Dashboard", "SEO", "Profile"]);
    expect(visibleNav("content_editor").map((i) => i.label)).toEqual(["Dashboard", "Pages", "Blog posts", "Navigation", "Media", "Legal documents", "Leads mirror", "Profile"]);
    expect(visibleNav("super_admin")).toHaveLength(12);
  });
  it("picks the longest matching item as active", () => {
    expect(activeNavHref("/admin")).toBe("/admin");
    expect(activeNavHref("/admin/seo/property/x")).toBe("/admin/seo");
    expect(activeNavHref("/admin/blogs/abc")).toBe("/admin/blogs");
    expect(activeNavHref("/elsewhere")).toBeNull();
  });
});

describe("password policy", () => {
  it("accepts a reasonable password", () => {
    expect(checkPassword("Jaipur-Roads-2026", { email: "asha@devsia.in" })).toBeNull();
  });
  it("rejects short, letter-only, common and email-based passwords", () => {
    expect(checkPassword("short1")).toBeTruthy();
    expect(checkPassword("onlyletterspassword")).toBeTruthy();
    expect(checkPassword("password1")).toBeTruthy();
    expect(checkPassword("asha-devsia-9999", { email: "asha@devsia.in" })).toBeTruthy();
  });
});

describe("sign-in lockout", () => {
  const t0 = new Date("2026-09-30T10:00:00Z");
  it("locks after the fifth wrong password for the lock period", () => {
    let state = afterSuccess();
    for (let i = 1; i < MAX_FAILED_ATTEMPTS; i++) {
      state = afterFailure(state, t0);
      expect(isLocked(state, t0)).toBe(false);
    }
    state = afterFailure(state, t0);
    expect(isLocked(state, t0)).toBe(true);
    expect(isLocked(state, new Date(t0.getTime() + (LOCK_MINUTES - 1) * 60_000))).toBe(true);
    expect(isLocked(state, new Date(t0.getTime() + (LOCK_MINUTES + 1) * 60_000))).toBe(false);
  });
  it("starts a fresh count after a lock has ended", () => {
    const locked = { failedAttempts: 5, lockedUntil: new Date(t0.getTime() - 1000) };
    expect(afterFailure(locked, t0).failedAttempts).toBe(1);
  });
  it("resets on success", () => {
    expect(afterSuccess()).toEqual({ failedAttempts: 0, lockedUntil: null });
  });
});
