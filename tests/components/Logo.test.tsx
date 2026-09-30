import { render, screen } from "@testing-library/react";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LOGO_FILE, Logo } from "@/components/layout/Logo";

describe("Logo", () => {
  it("links home and uses the supplied image file", () => {
    render(<Logo />);
    const link = screen.getByRole("link", { name: "DevSia home" });
    expect(link).toHaveAttribute("href", "/");
    const img = link.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toContain("devsia-logo.jpeg");
  });

  it("uses the same file on a white plate in the footer", () => {
    render(<Logo inverse />);
    const link = screen.getByRole("link", { name: "DevSia home" });
    expect(link).toHaveClass("plate");
    expect(link.querySelector("img")?.getAttribute("src")).toContain("devsia-logo.jpeg");
  });

  it("ships the official file as a JPEG with the recorded dimensions", () => {
    const file = join(process.cwd(), "public", LOGO_FILE.src);
    expect(existsSync(file)).toBe(true);
    const bytes = readFileSync(file);
    expect([bytes[0], bytes[1]]).toEqual([0xff, 0xd8]); // JPEG start marker
    // Read width and height from the first start-of-frame marker.
    let offset = 2;
    let width = 0;
    let height = 0;
    while (offset < bytes.length) {
      if (bytes[offset] !== 0xff) break;
      const marker = bytes[offset + 1];
      const length = bytes.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xc3) {
        height = bytes.readUInt16BE(offset + 5);
        width = bytes.readUInt16BE(offset + 7);
        break;
      }
      offset += 2 + length;
    }
    expect([width, height]).toEqual([LOGO_FILE.width, LOGO_FILE.height]);
  });
});
