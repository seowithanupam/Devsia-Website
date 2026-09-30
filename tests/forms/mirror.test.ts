import { describe, expect, it } from "vitest";
import { withLeadMirror, type LeadMirror, type LeadMirrorEntry } from "@/lib/forms/mirror";
import { createMockLeadProvider } from "@/lib/services/mock/lead-provider";

const enquiry = {
  fullName: "Rahul Sharma",
  mobile: "9845671230",
  propertyTypes: ["Plot"],
  preferredLocation: "Tonk Road",
  budgetBand: "25-50l",
  purpose: "Self Use",
  timeline: "1–3 Months",
  consent: true,
};

function recorder() {
  const entries: LeadMirrorEntry[] = [];
  const mirror: LeadMirror = { record: async (e) => void entries.push(e) };
  return { entries, mirror };
}

describe("leads mirror", () => {
  it("returns the inner provider untouched when there is no database", () => {
    const inner = createMockLeadProvider({ delayMs: 0 });
    expect(withLeadMirror(inner, null)).toBe(inner);
  });
  it("records a copy after the provider accepts, with the page it came from", async () => {
    const { entries, mirror } = recorder();
    const provider = withLeadMirror(createMockLeadProvider({ delayMs: 0 }), mirror);
    const result = await provider.submitLead(enquiry, { pageEnquired: "/properties/x" });
    expect(result.ok).toBe(true);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({ kind: "enquiry", name: "Rahul Sharma", phone: "9845671230", payload: { ...enquiry }, pageEnquired: "/properties/x" });
  });
  it("records nothing when the provider refuses (the CRM is the system of record)", async () => {
    const { entries, mirror } = recorder();
    const provider = withLeadMirror(createMockLeadProvider({ delayMs: 0, fail: true }), mirror);
    const result = await provider.submitLead(enquiry, {});
    expect(result.ok).toBe(false);
    expect(entries).toHaveLength(0);
  });
  it("never lets a failed mirror write change what the visitor sees", async () => {
    let reported = 0;
    const broken: LeadMirror = { record: async () => { throw new Error("db down"); } };
    const provider = withLeadMirror(createMockLeadProvider({ delayMs: 0 }), broken, () => void reported++);
    const result = await provider.submitLead(enquiry, {});
    expect(result.ok).toBe(true);
    expect(reported).toBe(1);
  });
  it("mirrors associate and contact submissions with their own kind", async () => {
    const { entries, mirror } = recorder();
    const provider = withLeadMirror(createMockLeadProvider({ delayMs: 0 }), mirror);
    await provider.registerAssociate(
      { fullName: "Amit", mobile: "9845671230", city: "Jaipur", preferredWorkingLocation: "Tonk Road", experience: "Fresher", propertyTypes: ["Plots"], worksWithOtherCompany: "no", consent: true },
      {},
    );
    await provider.submitContactRequest({ kind: "callback", fullName: "Asha", mobile: "9845671230", pageContext: "/about" }, {});
    expect(entries.map((e) => e.kind)).toEqual(["associate", "contact"]);
    expect(entries[1].pageEnquired).toBe("/about");
  });
});
