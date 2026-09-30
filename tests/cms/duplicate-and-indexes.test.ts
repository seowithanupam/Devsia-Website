import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { describeDuplicateKey } from "@/lib/cms/duplicate";
import { EXPECTED_INDEXES } from "@/lib/db/expected-indexes.mjs";

describe("duplicate key messages", () => {
  it("explains a duplicate email", () => {
    const d = describeDuplicateKey({ code: 11000, keyPattern: { email: 1 }, message: "E11000 duplicate key" });
    expect(d).toEqual({ field: "email", message: "An account with that email already exists." });
  });
  it("explains a duplicate slug", () => {
    expect(describeDuplicateKey({ code: 11000, keyPattern: { slug: 1 } })?.field).toBe("slug");
    expect(describeDuplicateKey({ code: 11000, keyPattern: { slug: 1 } })?.message).toMatch(/web address/);
  });
  it("reads the field from the message when the driver gives no key pattern", () => {
    expect(describeDuplicateKey({ code: 11000, message: "E11000 duplicate key error collection: x.users index: email_1 dup key" })?.field).toBe("email");
  });
  it("gives a general message for any other unique field", () => {
    expect(describeDuplicateKey({ code: 11000, keyPattern: { key: 1 } })?.message).toMatch(/already in use/);
  });
  it("ignores every other kind of error", () => {
    expect(describeDuplicateKey(new Error("boom"))).toBeNull();
    expect(describeDuplicateKey({ code: 121 })).toBeNull();
    expect(describeDuplicateKey(null)).toBeNull();
    expect(describeDuplicateKey("E11000")).toBeNull();
  });
});

describe("expected indexes", () => {
  const models = readFileSync(join(process.cwd(), "lib/db/models/index.ts"), "utf8");
  const unique = EXPECTED_INDEXES.filter((i) => i.unique);

  it("lists the unique indexes the Rebuild Specification asks for", () => {
    const has = (model: string, field: string) => unique.some((i) => i.model === model && Object.keys(i.keys).join() === field);
    expect(has("User", "email") && has("Post", "slug") && has("Page", "slug") && has("LegalDocument", "slug") && has("PropertySeoOverride", "slug")).toBe(true);
  });

  it("has one unique index for every `unique: true` declared in the schemas (so the two cannot drift apart)", () => {
    expect(unique.length).toBe((models.match(/unique: true/g) ?? []).length);
  });

  it("only names models that exist, and expires old login counters", () => {
    for (const spec of EXPECTED_INDEXES) expect(models, spec.model).toMatch(new RegExp(`${spec.model}:\\s+\\w+Model`));
    expect(EXPECTED_INDEXES.some((i) => i.model === "LoginAttempt" && i.expireAfterSeconds === 0)).toBe(true);
  });

  it("only ever asks for indexes to be added (nothing that drops, rebuilds or rewrites)", () => {
    const code = readFileSync(join(process.cwd(), "lib/db/indexes.ts"), "utf8");
    expect(/dropIndex|dropIndexes|syncIndexes|dropDatabase|dropCollection|deleteMany|deleteOne|updateMany|updateOne|\.remove\(/.test(code)).toBe(false);
    expect(code).toContain("createIndex");
  });
});
