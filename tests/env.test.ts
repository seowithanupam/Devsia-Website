import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ENV_REGISTRY, getSiteUrl, optionalEnv, requireEnv } from "@/lib/env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getSiteUrl", () => {
  it("falls back to localhost when nothing is set", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(getSiteUrl().origin).toBe("http://localhost:3000");
  });

  it("uses VERCEL_URL over localhost", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "devsia-preview.vercel.app");
    expect(getSiteUrl().origin).toBe("https://devsia-preview.vercel.app");
  });

  it("prefers NEXT_PUBLIC_SITE_URL and trims whitespace", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "  https://example.test/  ");
    vi.stubEnv("VERCEL_URL", "ignored.vercel.app");
    expect(getSiteUrl().origin).toBe("https://example.test");
  });

  it("never defaults to devsia.in", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(getSiteUrl().hostname).not.toContain("devsia.in");
  });

  it("throws a clear error for an invalid URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "not a url");
    expect(() => getSiteUrl()).toThrow(/not a valid absolute URL/);
  });
});

describe("optionalEnv and requireEnv", () => {
  it("treats blank values as unset", () => {
    vi.stubEnv("MONGODB_URI", "   ");
    expect(optionalEnv("MONGODB_URI")).toBeUndefined();
  });

  it("returns trimmed values", () => {
    vi.stubEnv("MONGODB_URI", " mongodb://example ");
    expect(requireEnv("MONGODB_URI", "the database layer")).toBe("mongodb://example");
  });

  it("names the variable and what needs it when missing", () => {
    vi.stubEnv("AUTH_SECRET", "");
    expect(() => requireEnv("AUTH_SECRET", "Auth.js")).toThrow(/AUTH_SECRET.*Auth\.js/);
  });
});

describe("environment registry", () => {
  it("requires nothing in Phase 1", () => {
    const phaseOneRequired = Object.entries(ENV_REGISTRY).filter(([, spec]) => spec.phase <= 1 && spec.required);
    expect(phaseOneRequired).toEqual([]);
  });

  it("keeps every CRM variable optional until integration", () => {
    for (const name of ["DEVSIA_API_BASE_URL", "DEVSIA_API_KEY", "DEVSIA_AGENCY_ID"] as const) {
      expect(ENV_REGISTRY[name].required).toBe(false);
    }
  });

  it("lists every registered variable in .env.example", () => {
    const example = readFileSync(join(process.cwd(), ".env.example"), "utf8");
    for (const name of Object.keys(ENV_REGISTRY)) {
      expect(example, `${name} missing from .env.example`).toContain(name);
    }
  });

  it("puts no real-looking secret values in .env.example", () => {
    const example = readFileSync(join(process.cwd(), ".env.example"), "utf8");
    const assigned = example
      .split("\n")
      .filter((line) => /^[A-Z_]+=/.test(line))
      .filter((line) => line.split("=")[1].trim() !== "");
    expect(assigned).toEqual([]);
  });
});
