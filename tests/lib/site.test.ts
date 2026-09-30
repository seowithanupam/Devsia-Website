import { describe, expect, it } from "vitest";
import { agencyCredit } from "@/lib/content/site";

describe("agency credit", () => {
  it("reads 'Design & Managed by Sriva Digital' and points at the agency site", () => {
    expect(`${agencyCredit.prefix} ${agencyCredit.name}`).toBe("Design & Managed by Sriva Digital");
    expect(agencyCredit.href).toBe("https://srivadigital.com/");
  });
});
