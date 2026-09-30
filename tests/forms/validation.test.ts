import { describe, expect, it } from "vitest";
import { normalizeIndianMobile } from "@/lib/forms/phone";
import { validateAssociate, validateContactRequest, validateEnquiry } from "@/lib/forms/validation";

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

const associate = {
  fullName: "Test Person",
  mobile: "9845671230",
  city: "Jaipur",
  preferredWorkingLocation: "Tonk Road",
  experience: "Fresher",
  propertyTypes: ["Residential"],
  worksWithOtherCompany: "yes",
  dealsClosed: "0",
  consent: true,
};

describe("mobile numbers", () => {
  it("accepts 10-digit numbers with optional +91 or 0", () => {
    expect(normalizeIndianMobile("+91 98456 71230")).toBe("9845671230");
    expect(normalizeIndianMobile("09845671230")).toBe("9845671230");
  });
  it("rejects short numbers", () => {
    expect(normalizeIndianMobile("951753460")).toBeNull();
  });
});

describe("enquiry validation", () => {
  it("accepts a complete enquiry", () => {
    expect(validateEnquiry(enquiry).ok).toBe(true);
  });
  it("reports each problem with the original's WhatsApp message", () => {
    const result = validateEnquiry({ ...enquiry, whatsapp: "951753460", propertyTypes: [], consent: false });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.whatsapp).toBe("Enter a valid 10-digit WhatsApp number.");
      expect(result.errors.propertyTypes).toBeTruthy();
      expect(result.errors.consent).toBeTruthy();
    }
  });
  it("treats a blank WhatsApp number as fine", () => {
    expect(validateEnquiry({ ...enquiry, whatsapp: "" }).ok).toBe(true);
  });
  it("rejects garbage bodies without throwing", () => {
    expect(validateEnquiry(null).ok).toBe(false);
    expect(validateEnquiry("text").ok).toBe(false);
  });
});

describe("associate validation", () => {
  it("accepts a complete application", () => {
    expect(validateAssociate(associate).ok).toBe(true);
  });
  it("requires consent and a property type", () => {
    const result = validateAssociate({ ...associate, consent: false, propertyTypes: [] });
    expect(result.ok).toBe(false);
  });
});

describe("contact request validation", () => {
  it("accepts a callback with only name and mobile", () => {
    expect(validateContactRequest({ kind: "callback", fullName: "Asha Rao", mobile: "9845671230" }).ok).toBe(true);
  });
  it("rejects an unknown kind and a bad mobile", () => {
    const result = validateContactRequest({ kind: "other", fullName: "A", mobile: "12" });
    expect(result.ok).toBe(false);
  });
});
