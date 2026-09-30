import { describe, expect, it } from "vitest";
import { BLOCK_DEFS, BLOCK_TYPES, EDITABLE_PAGE_SLUGS, PAGE_DEFS, PAGE_SLUGS, resolveBlocks, validateBlockData, validatePageBlocks, type PageSlug, type StoredBlock } from "@/lib/cms/blocks";
import { aboutIntro, homeHero, trustStrip, whyDevsia } from "@/lib/content/pages";

describe("block definitions", () => {
  it("covers the 16 blocks the handover names, plus the two added to make hard-coded text editable, and no others", () => {
    expect([...BLOCK_TYPES].sort()).toEqual(
      ["about-intro", "associate-strip", "company-contact", "company-services", "company-values", "enquire-side-panel", "enquiry-cta", "form-intro", "hero", "highlights", "insights", "insights-hero", "listing-hero", "localities", "new-projects-hero", "trust-strip", "upcoming-projects", "why-devsia"].sort(),
    );
  });
  it("makes every default pass its own validation (so an untouched page saves cleanly)", () => {
    for (const type of BLOCK_TYPES) {
      const result = validateBlockData(type, BLOCK_DEFS[type].defaults());
      expect(result.ok, `${type}: ${JSON.stringify(result)}`).toBe(true);
    }
  });
  it("defaults to the text the public site already shows", () => {
    expect(BLOCK_DEFS.hero.defaults()).toEqual(homeHero);
    expect(BLOCK_DEFS["trust-strip"].defaults()).toEqual({ items: trustStrip });
    expect(BLOCK_DEFS["why-devsia"].defaults()).toEqual(whyDevsia);
    expect(BLOCK_DEFS["about-intro"].defaults()).toEqual(aboutIntro);
  });
  it("gives every editable page at least one allowed block, and its defaults are allowed", () => {
    for (const slug of PAGE_SLUGS) {
      const def = PAGE_DEFS[slug];
      for (const b of def.defaults()) expect(def.allowed.includes(b.type)).toBe(true);
      for (const r of def.required) expect(def.allowed.includes(r)).toBe(true);
    }
    expect(EDITABLE_PAGE_SLUGS).toEqual(["home", "about", "properties", "new-projects", "enquire", "associates", "insights"]);
  });
});

describe("field validation", () => {
  it("requires required text and reports it by path", () => {
    const result = validateBlockData("hero", { title: "", paragraph: "ok" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.title).toBeTruthy();
  });
  it("reports errors inside lists with the item position", () => {
    const data = BLOCK_DEFS["why-devsia"].defaults();
    (data.points as Array<{ title: string }>)[1].title = "";
    const result = validateBlockData("why-devsia", data);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors["points.1.title"]).toBeTruthy();
  });
  it("drops unknown keys so extra data cannot be stored", () => {
    const result = validateBlockData("hero", { title: "T", paragraph: "P", evil: "<script>", __proto__: { x: 1 } });
    expect(result.ok).toBe(true);
    if (result.ok) expect(Object.keys(result.data).sort()).toEqual(["paragraph", "title"]);
  });
  it("rejects unsafe image addresses in blocks", () => {
    const data = BLOCK_DEFS["about-intro"].defaults();
    (data.image as { src: string }).src = "https://evil.example.com/x.jpg";
    const result = validateBlockData("about-intro", data);
    expect(result.ok).toBe(false);
  });
  it("enforces list limits and paragraph splitting", () => {
    const data = BLOCK_DEFS["trust-strip"].defaults();
    data.items = Array.from({ length: 9 }, () => ({ value: "v", caption: "c" }));
    expect(validateBlockData("trust-strip", data).ok).toBe(false);
    const cta = BLOCK_DEFS["enquiry-cta"].defaults();
    cta.promises = "one\ntwo\n\nthree";
    const r = validateBlockData("enquiry-cta", cta);
    expect(r.ok && r.data.promises).toEqual(["one", "two", "three"]);
  });
  it("only accepts a listed select option", () => {
    const data = BLOCK_DEFS["upcoming-projects"].defaults();
    (data.projects as Array<{ statusTone: string }>)[0].statusTone = "purple";
    expect(validateBlockData("upcoming-projects", data).ok).toBe(false);
  });
});

describe("page validation", () => {
  const home = () => PAGE_DEFS.home.defaults().map((b) => ({ type: b.type, enabled: true, data: b.data }));
  it("accepts the default home page", () => {
    const r = validatePageBlocks("home", home());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.blocks.map((b) => b.order)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });
  it("allows reordering, hiding and removing optional blocks", () => {
    const reordered = [...home()].reverse();
    expect(validatePageBlocks("home", reordered).ok).toBe(true);
    expect(validatePageBlocks("home", home().map((b) => (b.type === "trust-strip" ? { ...b, enabled: false } : b))).ok).toBe(true);
    expect(validatePageBlocks("home", home().filter((b) => b.type !== "why-devsia")).ok).toBe(true);
  });
  it("will not remove or hide a required block", () => {
    expect(validatePageBlocks("home", home().filter((b) => b.type !== "hero")).ok).toBe(false);
    expect(validatePageBlocks("home", home().map((b) => (b.type === "hero" ? { ...b, enabled: false } : b))).ok).toBe(false);
  });
  it("refuses blocks that do not belong on the page, and duplicates", () => {
    expect(validatePageBlocks("about", [...PAGE_DEFS.about.defaults().map((b) => ({ ...b, enabled: true })), { type: "hero", enabled: true, data: BLOCK_DEFS.hero.defaults() }]).ok).toBe(false);
    const dup = [...home(), home()[0]];
    expect(validatePageBlocks("home", dup).ok).toBe(false);
    expect(validatePageBlocks("home", [{ type: "nope", data: {} }]).ok).toBe(false);
    expect(validatePageBlocks("home", "x").ok).toBe(false);
  });
});

describe("resolving blocks for the public site", () => {
  it("uses defaults when nothing is stored", () => {
    for (const slug of PAGE_SLUGS) {
      expect(resolveBlocks(slug as PageSlug, null).map((b) => b.type)).toEqual(PAGE_DEFS[slug].defaults().map((b) => b.type));
    }
  });
  it("respects stored order and hidden blocks", () => {
    const stored: StoredBlock[] = [
      { type: "associate-strip", order: 0, enabled: true, data: BLOCK_DEFS["associate-strip"].defaults() },
      { type: "hero", order: 1, enabled: true, data: BLOCK_DEFS.hero.defaults() },
      { type: "trust-strip", order: 2, enabled: false, data: BLOCK_DEFS["trust-strip"].defaults() },
    ];
    expect(resolveBlocks("home", stored).map((b) => b.type)).toEqual(["associate-strip", "hero"]);
  });
  it("layers stored data over defaults and restores a missing required block", () => {
    const stored: StoredBlock[] = [{ type: "trust-strip", order: 0, enabled: true, data: BLOCK_DEFS["trust-strip"].defaults() }];
    const out = resolveBlocks("home", stored);
    expect(out[0].type).toBe("hero");
    const partial: StoredBlock[] = [{ type: "hero", order: 0, enabled: true, data: { title: "New headline" } }];
    const hero = resolveBlocks("home", partial)[0].data;
    expect(hero.title).toBe("New headline");
    expect(hero.paragraph).toBe(homeHero.paragraph);
  });
});

describe("text that used to be hard-coded is now editable", () => {
  it("has the Insights heading, intro and article-callback message as defaults, from the built-in text", () => {
    const hero = BLOCK_DEFS["insights-hero"].defaults();
    expect(hero.title).toBe("DevSia Insights");
    expect(hero.callbackSuccessTitle).toBe("Callback requested");
    expect(validateBlockData("insights-hero", hero).ok).toBe(true);
    expect(PAGE_DEFS.insights.required).toEqual(["insights-hero"]);
  });

  it("has the Enquire side panel as rows with a style, keeping the highlighted 'Included' row", () => {
    const panel = BLOCK_DEFS["enquire-side-panel"].defaults() as { rows: Array<{ label: string; value: string; tone: string }> };
    expect(panel.rows).toHaveLength(5);
    expect(panel.rows.find((r) => r.label === "Off-market inventory")?.tone).toBe("ok");
    expect(panel.rows.filter((r) => r.tone === "normal")).toHaveLength(4);
    expect(validateBlockData("enquire-side-panel", panel).ok).toBe(true);
    expect(PAGE_DEFS.enquire.required).toContain("enquire-side-panel");
  });

  it("has a different success message for the enquiry form and the associate form", () => {
    const enquire = PAGE_DEFS.enquire.defaults().find((b) => b.type === "form-intro")?.data;
    const associates = PAGE_DEFS.associates.defaults().find((b) => b.type === "form-intro")?.data;
    expect(enquire?.successTitle).toBe("Enquiry sent");
    expect(associates?.successTitle).toBe("Application submitted");
    expect(validateBlockData("form-intro", associates).ok).toBe(true);
  });

  it("has a success message for the About contact form", () => {
    const contact = BLOCK_DEFS["company-contact"].defaults();
    expect(contact.successTitle).toBe("Message sent");
    expect(validateBlockData("company-contact", contact).ok).toBe(true);
  });

  it("requires the success message text, so a form can never end with a blank confirmation", () => {
    const data = { ...BLOCK_DEFS["form-intro"].defaults(), successText: "" };
    const result = validateBlockData("form-intro", data);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.successText).toBeTruthy();
  });

  it("gives a page saved before these fields existed the built-in text for them", () => {
    const old: StoredBlock[] = [{ type: "form-intro", order: 0, enabled: true, data: { title: "Old title", intro: "Old intro" } }];
    const resolved = resolveBlocks("enquire", old);
    const intro = resolved.find((b) => b.type === "form-intro")?.data;
    expect(intro?.title).toBe("Old title");
    expect(intro?.successTitle).toBe("Enquiry sent");
    // The required side panel was not in the old page, so it is restored with its built-in rows.
    expect(resolved.some((b) => b.type === "enquire-side-panel")).toBe(true);
  });

  it("makes Insights an editable page whose heading cannot be removed", () => {
    expect(validatePageBlocks("insights", PAGE_DEFS.insights.defaults().map((b) => ({ ...b, enabled: true }))).ok).toBe(true);
    expect(validatePageBlocks("insights", []).ok).toBe(false);
  });
});

