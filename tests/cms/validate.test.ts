import { describe, expect, it } from "vitest";
import { cleanSingleLine, cleanString, escapeRegex, isSafeCanonical, isSafeHref, isSafeImageUrl, isSafeOgImageUrl, isValidEmail, isValidSlug } from "@/lib/cms/validate";
import { MAX_UPLOAD_BYTES, safeFilename, sniffImageType } from "@/lib/cms/media";

describe("links and images", () => {
  it("accepts safe links", () => {
    for (const ok of ["/about", "/about#services", "#contact", "https://example.com/x", "mailto:a@b.co", "tel:+911414000900"]) expect(isSafeHref(ok)).toBe(true);
  });
  it("rejects script, data and protocol-relative links", () => {
    for (const bad of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,x", "//evil.com", "ftp://x", "/a b", "", "vbscript:x"]) expect(isSafeHref(bad)).toBe(false);
  });
  it("only allows site paths and the Vercel Blob store as page images", () => {
    expect(isSafeImageUrl("/images/home/hero.jpg")).toBe(true);
    expect(isSafeImageUrl("https://abc123.public.blob.vercel-storage.com/media/x.jpg")).toBe(true);
    expect(isSafeImageUrl("https://evil.example.com/x.jpg")).toBe(false);
    expect(isSafeImageUrl("http://abc.public.blob.vercel-storage.com/x.jpg")).toBe(false);
    expect(isSafeImageUrl("//evil.com/x.jpg")).toBe(false);
    expect(isSafeImageUrl("javascript:alert(1)")).toBe(false);
  });
  it("allows any https address for Open Graph images and canonicals", () => {
    expect(isSafeOgImageUrl("https://cdn.example.com/og.png")).toBe(true);
    expect(isSafeOgImageUrl("http://cdn.example.com/og.png")).toBe(false);
    expect(isSafeCanonical("/properties")).toBe(true);
    expect(isSafeCanonical("javascript:x")).toBe(false);
  });
});

describe("text cleaning", () => {
  it("trims, caps and removes control characters", () => {
    expect(cleanString("  hello\u0000 world  ", 100)).toBe("hello world");
    expect(cleanString("x".repeat(50), 10)).toHaveLength(10);
    expect(cleanString(42, 10)).toBe("");
    expect(cleanSingleLine("a\n  b", 20)).toBe("a b");
  });
  it("validates slugs and emails", () => {
    expect(isValidSlug("tonk-road-rates")).toBe(true);
    for (const bad of ["Tonk", "a--b", "-a", "a-", "a b", ""]) expect(isValidSlug(bad)).toBe(false);
    expect(isValidEmail("asha@devsia.in")).toBe(true);
    expect(isValidEmail("nope")).toBe(false);
  });
  it("escapes regular expression characters for search", () => {
    expect(escapeRegex("a.b*c(d)")).toBe("a\\.b\\*c\\(d\\)");
  });
});

describe("media uploads", () => {
  const bytes = (...n: number[]) => Uint8Array.from(n);
  it("identifies images from their bytes, not their names", () => {
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0))?.contentType).toBe("image/jpeg");
    expect(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))?.ext).toBe("png");
    expect(sniffImageType(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))?.ext).toBe("gif");
    expect(sniffImageType(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50))?.ext).toBe("webp");
  });
  it("refuses SVG, HTML and unknown data", () => {
    expect(sniffImageType(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>"))).toBeNull();
    expect(sniffImageType(new TextEncoder().encode("<html><script>alert(1)</script>"))).toBeNull();
    expect(sniffImageType(bytes())).toBeNull();
  });
  it("makes storage-safe file names and has a size cap under Vercel's body limit", () => {
    expect(safeFilename("My Photo (1).PNG", "png")).toBe("my-photo-1.png");
    expect(safeFilename("../../etc/passwd", "jpg")).toBe("etc-passwd.jpg");
    expect(MAX_UPLOAD_BYTES).toBeLessThanOrEqual(4.5 * 1024 * 1024);
  });
});
