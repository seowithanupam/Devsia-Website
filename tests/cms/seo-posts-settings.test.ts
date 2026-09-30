import { describe, expect, it } from "vitest";
import { DEFAULT_PROPERTY_SEO_TEMPLATE, PROPERTY_SEO_TOKENS, renderSeoTemplate, resolvePropertySeo, robotsFor, unknownTokens, validateSeoInput, validateSeoTemplateInput } from "@/lib/cms/seo";
import { estimateReadMinutes, isPubliclyVisible, postToArticle, validatePostInput } from "@/lib/cms/posts";
import { DEFAULT_SETTINGS_RECORD, normalizePhone, settingsFromRecord, validateSettingsInput } from "@/lib/cms/settings";
import { DEFAULT_NAVIGATION, navigationFromRecord, validateNavigationInput } from "@/lib/cms/nav";
import { changedKeys, summarizeChange } from "@/lib/cms/audit";
import { checkUserChange, validateNewUser } from "@/lib/cms/users";
import { siteSettings } from "@/lib/content/site";
import { serializeBody } from "@/lib/cms/body-syntax";
import { articles } from "@/lib/content/articles";
import type { PostRecord } from "@/lib/cms/types";

const tokens = { title: "Rukmani nagar 166 sq yard", location: "Bhilwada Mega Highway", city: "Jaipur", type: "Plot", price: "₹26.4 L", ref: "DS-136BBB6F" };

describe("SEO templates", () => {
  it("reproduces the Phase 2 listing metadata until a template is saved", () => {
    const seo = resolvePropertySeo({ template: null, override: null, tokens });
    expect(seo.title).toBe("Rukmani nagar 166 sq yard, Bhilwada Mega Highway");
    expect(seo.description).toBe("Plot for sale in Bhilwada Mega Highway, Jaipur. ₹26.4 L.");
  });
  it("renders a custom template and lets a per-listing override win field by field", () => {
    const template = { titleTemplate: "{type} in {location} | {ref}", descriptionTemplate: "{title} at {price}", ogImage: "" };
    expect(resolvePropertySeo({ template, override: null, tokens }).title).toBe("Plot in Bhilwada Mega Highway | DS-136BBB6F");
    const merged = resolvePropertySeo({ template, override: { title: "Custom title", noIndex: true }, tokens });
    expect(merged.title).toBe("Custom title");
    expect(merged.description).toBe("Rukmani nagar 166 sq yard at ₹26.4 L");
    expect(merged.noIndex).toBe(true);
  });
  it("finds unknown placeholders and refuses them", () => {
    expect(unknownTokens("{title} {bogus} {price}")).toEqual(["bogus"]);
    expect(validateSeoTemplateInput({ titleTemplate: "{nope}", descriptionTemplate: "{title}" }).ok).toBe(false);
    expect(validateSeoTemplateInput({ ...DEFAULT_PROPERTY_SEO_TEMPLATE }).ok).toBe(true);
    expect(PROPERTY_SEO_TOKENS).toHaveLength(6);
    expect(renderSeoTemplate("{title}  x {zzz}", tokens)).toBe("Rukmani nagar 166 sq yard x {zzz}");
  });
  it("validates page SEO fields and drops empty ones", () => {
    const ok = validateSeoInput({ title: "T", description: "", canonical: "/about", ogImage: "https://cdn.example.com/a.png", noIndex: "on" });
    expect(ok.ok && ok.value).toEqual({ title: "T", canonical: "/about", ogImage: "https://cdn.example.com/a.png", noIndex: true });
    expect(validateSeoInput({ canonical: "javascript:x" }).ok).toBe(false);
    expect(validateSeoInput({ ogImage: "http://insecure.example.com/a.png" }).ok).toBe(false);
    const prefixed = validateSeoInput({ "seo.title": "P" }, "seo.");
    expect(prefixed.ok && prefixed.value).toEqual({ title: "P" });
  });
  it("turns noindex and nofollow into a robots directive", () => {
    expect(robotsFor(null)).toBeUndefined();
    expect(robotsFor({ title: "x" })).toBeUndefined();
    expect(robotsFor({ noIndex: true })).toEqual({ index: false, follow: true });
    expect(robotsFor({ noIndex: true, noFollow: true })).toEqual({ index: false, follow: false });
  });
});

const goodPost = {
  title: "Why Tonk Road rates moved",
  slug: "",
  excerpt: "A short summary.",
  body: "## First\n\nSome text here.",
  category: "Market note",
  tags: "Tonk Road, Rates",
  authorName: "Amit Kumar",
  authorRole: "",
  coverUrl: "",
  coverAlt: "",
  coverCaption: "",
  readMinutes: "",
  publishedDate: "",
};

describe("blog post input", () => {
  it("accepts a good post and makes the slug and category slug", () => {
    const r = validatePostInput(goodPost);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.slug).toBe("why-tonk-road-rates-moved");
      expect(r.value.categorySlug).toBe("market-note");
      expect(r.value.tags).toEqual(["Tonk Road", "Rates"]);
      expect(r.value.readMinutes).toBeNull();
    }
  });
  it("reports each problem on its own field", () => {
    const r = validatePostInput({ ...goodPost, title: "", body: "", slug: "Bad Slug", tags: "1,2,3,4,5,6,7,8,9", coverUrl: "https://evil.example.com/x.jpg", readMinutes: "500", publishedDate: "31-12-2026" });
    expect(r.ok).toBe(false);
    if (!r.ok) for (const k of ["title", "body", "slug", "tags", "coverUrl", "readMinutes", "publishedDate"]) expect(r.errors[k], k).toBeTruthy();
  });
  it("needs alt text when a cover is set, and validates nested SEO fields", () => {
    const r = validatePostInput({ ...goodPost, coverUrl: "/images/insights/residential-facade.jpg", coverAlt: "", "seo.canonical": "javascript:x" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.coverAlt).toBeTruthy();
      expect(r.errors["seo.canonical"]).toBeTruthy();
    }
  });
  it("estimates reading time from length", () => {
    expect(estimateReadMinutes("word ".repeat(1000))).toBe(5);
    expect(estimateReadMinutes("")).toBe(1);
  });
});

function record(over: Partial<PostRecord> = {}): PostRecord {
  const a = articles[0];
  return {
    id: "1",
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    body: serializeBody(a.body),
    category: a.category,
    categorySlug: a.categorySlug,
    tags: a.tags,
    authorName: a.author.name,
    authorRole: a.author.role ?? "",
    coverUrl: a.cover.src,
    coverAlt: a.cover.alt,
    coverCaption: a.cover.caption ?? "",
    readMinutes: a.readMinutes,
    featured: a.featured,
    placeholderBody: false,
    status: "published",
    publishedAt: "2026-08-24T00:00:00.000Z",
    seo: {},
    ...over,
  };
}

describe("posts on the public site", () => {
  it("maps a stored post to exactly the article the public pages render", () => {
    expect(postToArticle(record())).toEqual({ ...articles[0], seo: {} });
  });
  it("shows a placeholder cover when none is set, and works out reading time", () => {
    const article = postToArticle(record({ coverUrl: "", readMinutes: null }));
    expect(article.cover.src).toBe("/mock/editorial-placeholder.svg");
    expect(article.readMinutes).toBeGreaterThanOrEqual(1);
  });
  it("hides drafts and posts scheduled for the future", () => {
    const now = new Date("2026-09-30T00:00:00Z");
    expect(isPubliclyVisible({ status: "published", publishedAt: "2026-08-24T00:00:00Z" }, now)).toBe(true);
    expect(isPubliclyVisible({ status: "draft", publishedAt: "2026-08-24T00:00:00Z" }, now)).toBe(false);
    expect(isPubliclyVisible({ status: "published", publishedAt: "2026-12-01T00:00:00Z" }, now)).toBe(false);
    expect(isPubliclyVisible({ status: "published", publishedAt: null }, now)).toBe(false);
  });
});

describe("site settings", () => {
  it("derives call and WhatsApp links from the numbers people type", () => {
    expect(normalizePhone("+91 141 4000 900")).toEqual({ tel: "+911414000900", digits: "911414000900" });
    expect(normalizePhone("98290 41100")?.tel).toBe("+919829041100");
    expect(normalizePhone("0141 4000900")?.tel).toBe("+911414000900");
    expect(normalizePhone("12")).toBeNull();
  });
  it("reproduces the Phase 2 settings exactly when nothing is stored", () => {
    expect(settingsFromRecord(null)).toEqual(siteSettings);
    expect(settingsFromRecord(DEFAULT_SETTINGS_RECORD)).toEqual(siteSettings);
  });
  it("applies edits and recomputes derived fields", () => {
    const s = settingsFromRecord({ phoneDisplay: "+91 98290 00000", whatsappDisplay: "+91 98290 11111", addressLine2: "Jaipur 302001" });
    expect(s.phone.tel).toBe("+919829000000");
    expect(s.whatsapp.href).toBe("https://wa.me/919829011111");
    expect(s.addressOneLine).toBe("3rd Floor, Anand Bhawan, Tonk Road, Jaipur 302001");
  });
  it("validates the settings form", () => {
    expect(validateSettingsInput({ ...DEFAULT_SETTINGS_RECORD }).ok).toBe(true);
    const bad = validateSettingsInput({ ...DEFAULT_SETTINGS_RECORD, email: "nope", phoneDisplay: "12", agencyName: "" });
    expect(bad.ok).toBe(false);
    if (!bad.ok) for (const k of ["email", "phoneDisplay", "agencyName"]) expect(bad.errors[k]).toBeTruthy();
  });
});

describe("navigation", () => {
  it("defaults to the Phase 2 header, company column and legal links", () => {
    expect(navigationFromRecord(null)).toEqual(DEFAULT_NAVIGATION);
    expect(DEFAULT_NAVIGATION.header.map((l) => l.label)).toEqual(["Properties", "Insights", "About"]);
  });
  it("has the built-in header button labels, and fills them in for a record saved before they were editable", () => {
    expect(DEFAULT_NAVIGATION.headerButtons).toEqual({ associateLabel: "Become an associate", enquiryLabel: "Post your enquiry" });
    const old = { header: DEFAULT_NAVIGATION.header, footerCompany: DEFAULT_NAVIGATION.footerCompany, legal: DEFAULT_NAVIGATION.legal };
    expect(navigationFromRecord(old).headerButtons).toEqual(DEFAULT_NAVIGATION.headerButtons);
    expect(navigationFromRecord({ ...old, headerButtons: { associateLabel: "Partner", enquiryLabel: "Ask us" } }).headerButtons.enquiryLabel).toBe("Ask us");
  });

  it("requires both header button labels and keeps them short", () => {
    expect(validateNavigationInput({ ...DEFAULT_NAVIGATION, headerButtons: { associateLabel: "", enquiryLabel: "Ask us" } }).ok).toBe(false);
    expect(validateNavigationInput({ ...DEFAULT_NAVIGATION, headerButtons: { associateLabel: "Partner", enquiryLabel: "" } }).ok).toBe(false);
    const long = validateNavigationInput({ ...DEFAULT_NAVIGATION, headerButtons: { associateLabel: "x".repeat(80), enquiryLabel: "Ask us" } });
    expect(long.ok && long.value.headerButtons.associateLabel.length).toBe(40);
    expect(validateNavigationInput({ ...DEFAULT_NAVIGATION, headerButtons: { associateLabel: "Partner", enquiryLabel: "Ask us" } }).ok).toBe(true);
  });

  it("validates links and blocks unsafe hrefs", () => {
    expect(validateNavigationInput(DEFAULT_NAVIGATION).ok).toBe(true);
    const bad = validateNavigationInput({ ...DEFAULT_NAVIGATION, header: [{ label: "x", href: "javascript:alert(1)" }] });
    expect(bad.ok).toBe(false);
    expect(validateNavigationInput({ ...DEFAULT_NAVIGATION, header: [] }).ok).toBe(false);
    expect(validateNavigationInput({ ...DEFAULT_NAVIGATION, header: Array.from({ length: 9 }, () => ({ label: "a", href: "/a" })) }).ok).toBe(false);
  });
});

describe("audit helpers", () => {
  it("lists changed field names but never values", () => {
    expect(changedKeys({ a: 1, b: "x" }, { a: 1, b: "y", c: true })).toEqual(["b", "c"]);
    expect(summarizeChange("Settings", ["email", "phoneDisplay"])).toBe("Settings: changed email, phoneDisplay");
    expect(summarizeChange("Settings", [])).toBe("Settings: saved with no changes");
  });
});

describe("staff account rules", () => {
  it("validates a new account", () => {
    expect(validateNewUser({ name: "Asha", email: "ASHA@devsia.in", role: "content_editor", password: "Jaipur-Roads-2026" }).ok).toBe(true);
    const bad = validateNewUser({ name: "", email: "x", role: "owner", password: "short" });
    expect(bad.ok).toBe(false);
    if (!bad.ok) for (const k of ["name", "email", "role", "password"]) expect(bad.errors[k], k).toBeTruthy();
  });
  it("stops people locking themselves or everyone out", () => {
    const target = { id: "u2", role: "super_admin" as const, active: true };
    expect(checkUserChange({ actorId: "u1", target, next: { role: "content_editor", active: true }, activeSuperAdmins: 2 })).toBeNull();
    expect(checkUserChange({ actorId: "u1", target, next: { role: "content_editor", active: true }, activeSuperAdmins: 1 })).toBeTruthy();
    expect(checkUserChange({ actorId: "u1", target, next: { role: "super_admin", active: false }, activeSuperAdmins: 1 })).toBeTruthy();
    expect(checkUserChange({ actorId: "u2", target, next: { role: "content_editor", active: true }, activeSuperAdmins: 3 })).toBeTruthy();
    expect(checkUserChange({ actorId: "u2", target, next: { role: "super_admin", active: true }, activeSuperAdmins: 1 })).toBeNull();
  });
});
