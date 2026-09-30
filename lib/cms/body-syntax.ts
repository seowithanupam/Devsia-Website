import { slugify } from "@/lib/format";
import type { ArticleBlock, LegalDocument } from "@/lib/content/types";

/**
 * Plain-text syntax for article bodies and legal text. It is stored as text in MongoDB and converted to the
 * renderable blocks the public pages already use. It keeps the editor a plain textarea (no rich-text package).
 *
 *   ## Heading                         section heading (an id is made from the words; "## Heading {#my-id}" sets one)
 *   A paragraph of text.               paragraphs are separated by a blank line
 *   - item                             bullet list (consecutive lines)
 *   > quoted text                      pull quote
 *   1. Step title :: Step text         numbered steps (consecutive lines)
 *   !note Callout title :: Callout text
 *   Table: optional caption
 *   | Heading | Heading |
 *   | --- | --- |
 *   | cell | cell |
 */

const HEADING = /^##\s+(.+?)(?:\s+\{#([a-z0-9-]+)\})?\s*$/;
const STEP = /^\d+\.\s+(.+?)\s+::\s+(.+)$/;
const NOTE = /^!note\s+(.+?)\s+::\s+(.+)$/;

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

const isSeparatorRow = (cells: string[]) => cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));

export function parseBody(source: string): ArticleBlock[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ArticleBlock[] = [];
  const usedIds = new Set<string>();
  let paragraph: string[] = [];
  let pendingCaption: string | undefined;

  const flushParagraph = () => {
    if (paragraph.length > 0) blocks.push({ type: "p", text: paragraph.join(" ") });
    paragraph = [];
  };

  const uniqueId = (wanted: string) => {
    const base = wanted || "section";
    let id = base;
    let n = 2;
    while (usedIds.has(id)) id = `${base}-${n++}`;
    usedIds.add(id);
    return id;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") {
      flushParagraph();
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flushParagraph();
      const text = heading[1].trim();
      blocks.push({ type: "h2", id: uniqueId(heading[2] ?? slugify(text)), text });
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) items.push(lines[i++].trim().slice(2).trim());
      i--;
      blocks.push({ type: "ul", items });
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      const parts: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) parts.push(lines[i++].trim().slice(2).trim());
      i--;
      blocks.push({ type: "quote", text: parts.join(" ") });
      continue;
    }

    if (STEP.test(line)) {
      flushParagraph();
      const items: Array<{ title: string; text: string }> = [];
      while (i < lines.length) {
        const m = STEP.exec(lines[i].trim());
        if (!m) break;
        items.push({ title: m[1].trim(), text: m[2].trim() });
        i++;
      }
      i--;
      blocks.push({ type: "steps", items });
      continue;
    }

    const note = NOTE.exec(line);
    if (note) {
      flushParagraph();
      blocks.push({ type: "callout", title: note[1].trim(), text: note[2].trim() });
      continue;
    }

    if (/^table:/i.test(line) && lines[i + 1]?.trim().startsWith("|")) {
      flushParagraph();
      pendingCaption = line.replace(/^table:\s*/i, "").trim() || undefined;
      continue;
    }

    if (line.startsWith("|")) {
      flushParagraph();
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(splitRow(lines[i++]));
      i--;
      const withoutSeparator = rows.filter((r) => !isSeparatorRow(r));
      const [headers, ...body] = withoutSeparator;
      if (headers) {
        blocks.push({ type: "table", ...(pendingCaption ? { caption: pendingCaption } : {}), headers, rows: body });
      }
      pendingCaption = undefined;
      continue;
    }

    paragraph.push(line);
  }
  flushParagraph();
  return blocks;
}

export function serializeBody(blocks: ArticleBlock[]): string {
  const parts = blocks.map((block) => {
    switch (block.type) {
      case "p":
        return block.text;
      case "h2":
        return block.id === (slugify(block.text) || "section") ? `## ${block.text}` : `## ${block.text} {#${block.id}}`;
      case "ul":
        return block.items.map((item) => `- ${item}`).join("\n");
      case "quote":
        return `> ${block.text}`;
      case "steps":
        return block.items.map((item, index) => `${index + 1}. ${item.title} :: ${item.text}`).join("\n");
      case "callout":
        return `!note ${block.title} :: ${block.text}`;
      case "table": {
        const head = `| ${block.headers.join(" | ")} |`;
        const rule = `| ${block.headers.map(() => "---").join(" | ")} |`;
        const rows = block.rows.map((row) => `| ${row.join(" | ")} |`);
        return [...(block.caption ? [`Table: ${block.caption}`] : []), head, rule, ...rows].join("\n");
      }
    }
  });
  return parts.join("\n\n");
}

/* ---------------------------------- legal text ---------------------------------- */

type LegalSection = LegalDocument["sections"][number];

export type LegalParse = { ok: true; sections: LegalSection[] } | { ok: false; error: string };

/** "## Heading", then paragraphs (blank-line separated) and "- " bullets. Paragraphs are listed before bullets. */
export function parseLegalSections(source: string): LegalParse {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const sections: LegalSection[] = [];
  let current: { heading: string; paragraphs: string[]; bullets: string[] } | null = null;
  let buffer: string[] = [];

  const flushBuffer = () => {
    if (buffer.length > 0 && current) current.paragraphs.push(buffer.join(" "));
    buffer = [];
  };
  const closeSection = () => {
    flushBuffer();
    if (current) {
      const section: LegalSection = { heading: current.heading };
      if (current.paragraphs.length > 0) section.paragraphs = current.paragraphs;
      if (current.bullets.length > 0) section.bullets = current.bullets;
      sections.push(section);
    }
    current = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    const heading = /^##\s+(.+)$/.exec(line);
    if (heading) {
      closeSection();
      current = { heading: heading[1].trim(), paragraphs: [], bullets: [] };
      continue;
    }
    if (line === "") {
      flushBuffer();
      continue;
    }
    if (!current) return { ok: false, error: "Start each section with a heading line, like: ## What we collect" };
    if (line.startsWith("- ")) {
      flushBuffer();
      current.bullets.push(line.slice(2).trim());
    } else {
      buffer.push(line);
    }
  }
  closeSection();
  if (sections.length === 0) return { ok: false, error: "Add at least one section, starting with a ## heading line." };
  return { ok: true, sections };
}

export function serializeLegalSections(sections: LegalSection[]): string {
  return sections
    .map((section) => [`## ${section.heading}`, ...(section.paragraphs ?? []), ...(section.bullets && section.bullets.length > 0 ? [section.bullets.map((b) => `- ${b}`).join("\n")] : [])].join("\n\n"))
    .join("\n\n");
}
