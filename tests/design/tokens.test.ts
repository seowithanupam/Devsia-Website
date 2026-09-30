import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BREAKPOINTS, MEDIA_QUERIES } from "@/lib/design/breakpoints";

const css = readFileSync(join(process.cwd(), "styles/tokens.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** Reads `--name: value;` pairs from the first :root block, ignoring comments. */
function rootTokens(): Record<string, string> {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const start = withoutComments.indexOf(":root");
  const block = withoutComments.slice(start, withoutComments.indexOf("}", start));
  const tokens: Record<string, string> = {};
  for (const match of block.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) {
    tokens[match[1]] = match[2].replace(/\s+/g, " ").trim();
  }
  return tokens;
}

describe("design tokens match the recovered original design", () => {
  const tokens = rootTokens();

  it.each([
    ["--color-navy", "#0A2B5C"],
    ["--color-navy-hover", "#12457E"],
    ["--color-navy-tint", "#EEF3FA"],
    ["--color-red", "#D6122B"],
    ["--color-red-hover", "#B00E23"],
    ["--color-red-tint", "#FDEDEF"],
    ["--color-ink", "#111820"],
    ["--color-muted", "#57616F"],
    ["--color-faint", "#69737F"],
    ["--color-line", "#E4E9F0"],
    ["--color-line-strong", "#CFD7E2"],
    ["--color-surface-alt", "#F6F8FB"],
    ["--color-ok", "#0F7B4F"],
    ["--color-ok-tint", "#E9F6F0"],
    ["--color-gold", "#9A6700"],
    ["--color-gold-tint", "#FDF7E6"],
    ["--color-footer-bg", "#08213F"],
    ["--color-footer-ink", "#D7E0EC"],
    ["--color-footer-accent", "#FF8095"],
    ["--color-navy-label", "#8FB3E0"],
    ["--color-live", "#4ADE80"],
    ["--color-input-hover", "#B6C1D0"],
    ["--color-card-hover-border", "#D3DCE8"],
    ["--color-image-placeholder", "#E9EDF3"],
  ])("%s is %s", (name, value) => {
    expect(tokens[name]).toBe(value);
  });

  it("uses the original radius, shadow and easing values", () => {
    expect(tokens["--radius-card"]).toBe("14px");
    expect(tokens["--radius-control"]).toBe("9px");
    expect(tokens["--shadow-sm"]).toBe("0 1px 2px rgba(17, 24, 32, 0.05)");
    expect(tokens["--shadow-md"]).toBe("0 6px 20px rgba(17, 24, 32, 0.09)");
    expect(tokens["--shadow-lg"]).toBe("0 20px 48px rgba(17, 24, 32, 0.13)");
    expect(tokens["--ease"]).toBe("cubic-bezier(0.2, 0.8, 0.25, 1)");
  });

  it("uses the original desktop layout values", () => {
    expect(tokens["--container-max"]).toBe("1320px");
    expect(tokens["--gutter"]).toBe("28px");
    expect(tokens["--section-y"]).toBe("88px");
    expect(tokens["--grid-gap"]).toBe("22px");
    expect(tokens["--header-h"]).toBe("74px");
  });

  it("changes gutter, section and grid spacing at the original breakpoints", () => {
    expect(css).toMatch(/@media \(max-width: 1199px\)\s*{\s*:root\s*{[^}]*--gutter: 22px;[^}]*--section-y: 64px;[^}]*--grid-gap: 18px;/);
    expect(css).toMatch(/@media \(max-width: 809px\)\s*{\s*:root\s*{[^}]*--gutter: 16px;[^}]*--section-y: 48px;[^}]*--grid-gap: 14px;/);
  });
});

describe("breakpoints", () => {
  it("match the original design", () => {
    expect(BREAKPOINTS).toEqual({ tabletMax: 1199, mobileMax: 809 });
    expect(MEDIA_QUERIES.tabletAndBelow).toBe("(max-width: 1199px)");
    expect(MEDIA_QUERIES.mobile).toBe("(max-width: 809px)");
  });
});

describe("fonts", () => {
  const fonts = readFileSync(join(process.cwd(), "styles/fonts.css"), "utf8");

  it("declares four Plus Jakarta Sans subsets covering weights 400 to 800", () => {
    expect(fonts.match(/@font-face/g)).toHaveLength(4);
    expect(fonts.match(/font-weight: 400 800;/g)).toHaveLength(4);
    expect(fonts).toContain("U+20A0-20AB, U+20AD-20C0"); // latin-ext range that contains the rupee sign
  });
});
