import { describe, expect, it } from "vitest";
import { processAssociate, processContactRequest, processEnquiry } from "@/lib/forms/submission";
import { createMockLeadProvider } from "@/lib/services/mock/lead-provider";
import type { LeadProvider } from "@/lib/forms/types";

const NOW = 1_000_000;
const enquiry = {
  fullName: "Rahul Sharma",
  mobile: "9845671230",
  propertyTypes: ["Plot"],
  preferredLocation: "Tonk Road",
  budgetBand: "25-50l",
  purpose: "Self Use",
  timeline: "1–3 Months",
  consent: true,
  formStartedAt: NOW - 10_000,
};

function countingProvider() {
  const calls = { lead: 0, associate: 0, contact: 0 };
  const base = createMockLeadProvider({ delayMs: 0 });
  const provider: LeadProvider = {
    submitLead: async (...args) => {
      calls.lead++;
      return base.submitLead(...args);
    },
    registerAssociate: async (...args) => {
      calls.associate++;
      return base.registerAssociate(...args);
    },
    submitContactRequest: async (...args) => {
      calls.contact++;
      return base.submitContactRequest(...args);
    },
  };
  return { provider, calls };
}

describe("enquiry handling", () => {
  it("sends a valid, human-paced enquiry to the provider", async () => {
    const { provider, calls } = countingProvider();
    const result = await processEnquiry(enquiry, { provider, now: () => NOW });
    expect(result.status).toBe(200);
    expect(calls.lead).toBe(1);
  });

  it("silently discards honeypot submissions but still answers success", async () => {
    const { provider, calls } = countingProvider();
    const result = await processEnquiry({ ...enquiry, website_url: "http://spam" }, { provider, now: () => NOW });
    expect(result.status).toBe(200);
    expect(calls.lead).toBe(0);
  });

  it("silently discards submissions that arrive too fast", async () => {
    const { provider, calls } = countingProvider();
    const result = await processEnquiry({ ...enquiry, formStartedAt: NOW - 500 }, { provider, now: () => NOW });
    expect(result.status).toBe(200);
    expect(calls.lead).toBe(0);
  });

  it("returns field errors before any spam check", async () => {
    const { provider, calls } = countingProvider();
    const result = await processEnquiry({ ...enquiry, mobile: "12" }, { provider, now: () => NOW });
    expect(result.status).toBe(422);
    expect(calls.lead).toBe(0);
  });

  it("reports a provider failure as 502", async () => {
    const provider = createMockLeadProvider({ delayMs: 0, fail: true });
    const result = await processEnquiry(enquiry, { provider, now: () => NOW });
    expect(result.status).toBe(502);
  });
});

describe("associate and contact handling", () => {
  it("routes to the right provider methods", async () => {
    const { provider, calls } = countingProvider();
    await processAssociate(
      {
        fullName: "Test Person",
        mobile: "9845671230",
        city: "Jaipur",
        preferredWorkingLocation: "Tonk Road",
        experience: "Fresher",
        propertyTypes: ["Residential"],
        worksWithOtherCompany: "yes",
        dealsClosed: "0",
        consent: true,
        formStartedAt: NOW - 10_000,
      },
      { provider, now: () => NOW },
    );
    await processContactRequest(
      { kind: "callback", fullName: "Asha Rao", mobile: "9845671230", formStartedAt: NOW - 10_000 },
      { provider, now: () => NOW },
    );
    expect(calls).toEqual({ lead: 0, associate: 1, contact: 1 });
  });
});
