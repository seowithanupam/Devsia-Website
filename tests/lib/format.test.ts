import { describe, expect, it } from "vitest";
import { formatArticleDate, formatIndianNumber, formatPriceLabel, formatRupees, initials, slugify } from "@/lib/format";

describe("formatting", () => {
  it("formats price labels as the original did", () => {
    expect(formatPriceLabel(2_640_000)).toBe("₹26.4 L");
    expect(formatPriceLabel(4_433_000)).toBe("₹44.33 L");
    expect(formatPriceLabel(3_500_000)).toBe("₹35 L");
    expect(formatPriceLabel(19_500_000)).toBe("₹1.95 Cr");
  });
  it("groups digits the Indian way", () => {
    expect(formatIndianNumber(999)).toBe("999");
    expect(formatRupees(1_390_000)).toBe("₹13,90,000");
    expect(formatRupees(9_520_000)).toBe("₹95,20,000");
  });
  it("formats dates, slugs and initials", () => {
    expect(formatArticleDate("2026-08-02")).toBe("02 August 2026");
    expect(slugify("Nature home Tulsi 111.11gaj")).toBe("nature-home-tulsi-111-11gaj");
    expect(initials("Amit Kumar")).toBe("AK");
  });
});
