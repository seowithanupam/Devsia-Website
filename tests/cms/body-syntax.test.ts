import { describe, expect, it } from "vitest";
import { articles } from "@/lib/content/articles";
import { legalDocuments } from "@/lib/content/legal";
import { parseBody, parseLegalSections, serializeBody, serializeLegalSections } from "@/lib/cms/body-syntax";
import { legalDocumentFromRecord, legalRecordFromDocument, validateLegalInput } from "@/lib/cms/legal";

describe("article body syntax", () => {
  it("round-trips every article of the site exactly", () => {
    for (const article of articles) {
      const text = serializeBody(article.body);
      expect(parseBody(text), article.slug).toEqual(article.body);
    }
  });
  it("parses each block kind", () => {
    const blocks = parseBody(
      ["Intro line one", "continues here.", "", "## A heading", "", "- one", "- two", "", "> a quote", "", "1. First :: does this", "2. Second :: does that", "", "!note Careful :: read this", "", "Table: Rates", "| A | B |", "| --- | --- |", "| 1 | 2 |"].join("\n"),
    );
    expect(blocks.map((b) => b.type)).toEqual(["p", "h2", "ul", "quote", "steps", "callout", "table"]);
    expect(blocks[0]).toEqual({ type: "p", text: "Intro line one continues here." });
    expect(blocks[1]).toEqual({ type: "h2", id: "a-heading", text: "A heading" });
    expect(blocks[6]).toEqual({ type: "table", caption: "Rates", headers: ["A", "B"], rows: [["1", "2"]] });
  });
  it("makes heading ids unique and honours a custom id", () => {
    const blocks = parseBody("## Same\n\n## Same\n\n## Other {#custom-id}");
    expect(blocks.filter((b) => b.type === "h2").map((b) => (b as { id: string }).id)).toEqual(["same", "same-2", "custom-id"]);
  });
  it("treats HTML as plain text (it is rendered as text, never as markup)", () => {
    const blocks = parseBody("<script>alert(1)</script>");
    expect(blocks).toEqual([{ type: "p", text: "<script>alert(1)</script>" }]);
  });
  it("copes with empty input and stray table rows", () => {
    expect(parseBody("")).toEqual([]);
    expect(parseBody("| only | a row |").length).toBe(1);
  });
});

describe("legal text syntax", () => {
  it("round-trips both legal documents", () => {
    for (const doc of legalDocuments) {
      const parsed = parseLegalSections(serializeLegalSections(doc.sections));
      expect(parsed.ok && parsed.sections, doc.id).toEqual(doc.sections);
    }
  });
  it("rejects text before the first heading and empty text", () => {
    expect(parseLegalSections("no heading").ok).toBe(false);
    expect(parseLegalSections("").ok).toBe(false);
  });
  it("turns a stored record back into the document the public page renders", () => {
    const doc = legalDocuments[0];
    expect(legalDocumentFromRecord(legalRecordFromDocument(doc))).toEqual(doc);
  });
  it("validates the legal form", () => {
    const rec = legalRecordFromDocument(legalDocuments[1]);
    expect(validateLegalInput({ ...rec }).ok).toBe(true);
    expect(validateLegalInput({ ...rec, title: "" }).ok).toBe(false);
    expect(validateLegalInput({ ...rec, body: "plain text" }).ok).toBe(false);
  });
});
