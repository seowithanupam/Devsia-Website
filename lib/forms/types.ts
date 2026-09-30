/**
 * Inputs collected by the public forms. These are the WEBSITE's field names and values,
 * taken from the live forms in the walkthrough video. A later CRM adapter maps them to
 * the PropDesk request bodies documented in the vendor PDF.
 */

export type EnquiryInput = {
  fullName: string;
  /** Digits as typed by the visitor; normalised on validation. */
  mobile: string;
  whatsapp?: string;
  callTime?: string;
  propertyTypes: string[];
  /** Comma-separated areas, as typed. */
  preferredLocation: string;
  budgetBand: string;
  purpose: string;
  timeline: string;
  siteVisit?: string;
  notes?: string;
  consent: boolean;
};

export type AssociateInput = {
  fullName: string;
  mobile: string;
  whatsapp?: string;
  email?: string;
  city: string;
  preferredWorkingLocation: string;
  experience: string;
  propertyTypes: string[];
  currentOccupation?: string;
  worksWithOtherCompany: "yes" | "no" | "";
  dealsClosed?: string;
  consent: boolean;
};

/**
 * About-page message, article/property "Request a callback", "Register interest".
 * The CRM destination for these is UNKNOWN (no endpoint is documented), so they only
 * ever reach the mock provider for now.
 */
export type ContactRequestInput = {
  kind: "about-message" | "callback" | "register-interest";
  fullName: string;
  mobile: string;
  subject?: string;
  message?: string;
  /** Path of the page the request came from. */
  pageContext?: string;
};

export type SubmissionMeta = {
  /** Page the visitor submitted from. */
  pageEnquired?: string;
};

export type SubmissionResult =
  | { ok: true }
  | { ok: false; code: "unavailable"; message: string };

/** Errors keyed by field name. */
export type FieldErrors = Record<string, string>;

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors };

/** Lead and associate submission provider. Mock now, PropDesk later. */
export interface LeadProvider {
  submitLead(input: EnquiryInput, meta: SubmissionMeta): Promise<SubmissionResult>;
  registerAssociate(input: AssociateInput, meta: SubmissionMeta): Promise<SubmissionResult>;
  submitContactRequest(input: ContactRequestInput, meta: SubmissionMeta): Promise<SubmissionResult>;
}
