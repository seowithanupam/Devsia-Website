import {
  ASSOCIATE_PROPERTY_TYPE_OPTIONS,
  BUDGET_OPTIONS,
  CALL_TIME_OPTIONS,
  CONTACT_SUBJECT_OPTIONS,
  DEALS_CLOSED_OPTIONS,
  EXPERIENCE_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  PURPOSE_OPTIONS,
  SITE_VISIT_OPTIONS,
  TIMELINE_OPTIONS,
} from "./options";
import { normalizeIndianMobile } from "./phone";
import type {
  AssociateInput,
  ContactRequestInput,
  EnquiryInput,
  FieldErrors,
  ValidationResult,
} from "./types";

/**
 * Validation for every public form. The same functions run in the browser and on the
 * server. Only "Enter a valid 10-digit WhatsApp number" is a message seen in the video;
 * the other messages are ASSUMED wording.
 */

/** TEMPORARY limit. The original's limits are UNKNOWN. */
export const MAX_NOTES_LENGTH = 2000;
export const MAX_NAME_LENGTH = 120;

type Raw = Record<string, unknown>;

function asObject(body: unknown): Raw {
  return typeof body === "object" && body !== null ? (body as Raw) : {};
}

function str(raw: Raw, key: string): string {
  const value = raw[key];
  return typeof value === "string" ? value.trim() : "";
}

function strList(raw: Raw, key: string): string[] {
  const value = raw[key];
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function oneOf<T extends string>(value: string, options: readonly T[]): value is T {
  return (options as readonly string[]).includes(value);
}

function checkName(raw: Raw, errors: FieldErrors): string {
  const name = str(raw, "fullName");
  if (name.length < 2) errors.fullName = "Enter your full name.";
  else if (name.length > MAX_NAME_LENGTH) errors.fullName = "Enter a shorter name.";
  return name;
}

function checkMobile(raw: Raw, key: string, errors: FieldErrors, label: string): string {
  const parsed = normalizeIndianMobile(str(raw, key));
  if (parsed === null) {
    errors[key] = `Enter a valid 10-digit ${label} number.`;
    return "";
  }
  return parsed;
}

function checkOptionalMobile(raw: Raw, key: string, errors: FieldErrors, label: string): string | undefined {
  const value = str(raw, key);
  if (value === "") return undefined;
  return checkMobile(raw, key, errors, label) || undefined;
}

/** Splits "Tonk Road, Mansarovar" into ["Tonk Road", "Mansarovar"]. */
export function splitAreas(text: string): string[] {
  return text
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

export function validateEnquiry(body: unknown): ValidationResult<EnquiryInput> {
  const raw = asObject(body);
  const errors: FieldErrors = {};

  const fullName = checkName(raw, errors);
  const mobile = checkMobile(raw, "mobile", errors, "mobile");
  const whatsapp = checkOptionalMobile(raw, "whatsapp", errors, "WhatsApp");

  const propertyTypes = strList(raw, "propertyTypes").filter((t) => oneOf(t, PROPERTY_TYPE_OPTIONS));
  if (propertyTypes.length === 0) errors.propertyTypes = "Select at least one property type.";

  const preferredLocation = str(raw, "preferredLocation");
  if (splitAreas(preferredLocation).length === 0) errors.preferredLocation = "Enter at least one preferred area.";

  const budgetBand = str(raw, "budgetBand");
  if (!BUDGET_OPTIONS.some((o) => o.value === budgetBand)) errors.budgetBand = "Choose a budget.";

  const purpose = str(raw, "purpose");
  if (!oneOf(purpose, PURPOSE_OPTIONS)) errors.purpose = "Choose a purpose.";

  const timeline = str(raw, "timeline");
  if (!oneOf(timeline, TIMELINE_OPTIONS)) errors.timeline = "Choose when you plan to buy.";

  const siteVisit = str(raw, "siteVisit");
  if (siteVisit !== "" && !oneOf(siteVisit, SITE_VISIT_OPTIONS)) errors.siteVisit = "Choose one of the options.";

  const callTime = str(raw, "callTime");
  if (callTime !== "" && !oneOf(callTime, CALL_TIME_OPTIONS)) errors.callTime = "Choose one of the options.";

  const notes = str(raw, "notes");
  if (notes.length > MAX_NOTES_LENGTH) errors.notes = `Keep notes under ${MAX_NOTES_LENGTH} characters.`;

  if (raw.consent !== true) errors.consent = "Please confirm to continue.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      fullName,
      mobile,
      whatsapp,
      callTime: callTime === "" || callTime === "No preference" ? undefined : callTime,
      propertyTypes,
      preferredLocation,
      budgetBand,
      purpose,
      timeline,
      siteVisit: siteVisit === "" ? undefined : siteVisit,
      notes: notes === "" ? undefined : notes,
      consent: true,
    },
  };
}

export function validateAssociate(body: unknown): ValidationResult<AssociateInput> {
  const raw = asObject(body);
  const errors: FieldErrors = {};

  const fullName = checkName(raw, errors);
  const mobile = checkMobile(raw, "mobile", errors, "mobile");
  const whatsapp = checkOptionalMobile(raw, "whatsapp", errors, "WhatsApp");

  const email = str(raw, "email");
  if (email !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";

  const city = str(raw, "city");
  if (city === "") errors.city = "Enter your city or area.";

  const preferredWorkingLocation = str(raw, "preferredWorkingLocation");
  if (preferredWorkingLocation === "") errors.preferredWorkingLocation = "Enter your preferred working location.";

  const experience = str(raw, "experience");
  if (!oneOf(experience, EXPERIENCE_OPTIONS)) errors.experience = "Choose your experience.";

  const propertyTypes = strList(raw, "propertyTypes").filter((t) => oneOf(t, ASSOCIATE_PROPERTY_TYPE_OPTIONS));
  if (propertyTypes.length === 0) errors.propertyTypes = "Select at least one property type.";

  const worksRaw = str(raw, "worksWithOtherCompany");
  if (worksRaw !== "yes" && worksRaw !== "no") errors.worksWithOtherCompany = "Choose Yes or No.";

  const dealsClosed = str(raw, "dealsClosed");
  if (dealsClosed !== "" && !oneOf(dealsClosed, DEALS_CLOSED_OPTIONS)) errors.dealsClosed = "Choose one of the options.";

  if (raw.consent !== true) errors.consent = "Please confirm to continue.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const occupation = str(raw, "currentOccupation");
  return {
    ok: true,
    value: {
      fullName,
      mobile,
      whatsapp,
      email: email === "" ? undefined : email,
      city,
      preferredWorkingLocation,
      experience,
      propertyTypes,
      currentOccupation: occupation === "" ? undefined : occupation,
      worksWithOtherCompany: worksRaw === "yes" ? "yes" : "no",
      dealsClosed: dealsClosed === "" ? undefined : dealsClosed,
      consent: true,
    },
  };
}

export function validateContactRequest(body: unknown): ValidationResult<ContactRequestInput> {
  const raw = asObject(body);
  const errors: FieldErrors = {};

  const kind = str(raw, "kind");
  if (kind !== "about-message" && kind !== "callback" && kind !== "register-interest") {
    errors.kind = "Unknown request type.";
  }
  const fullName = checkName(raw, errors);
  const mobile = checkMobile(raw, "mobile", errors, "mobile");

  const subject = str(raw, "subject");
  if (subject !== "" && !oneOf(subject, CONTACT_SUBJECT_OPTIONS)) errors.subject = "Choose one of the options.";

  const message = str(raw, "message");
  if (message.length > MAX_NOTES_LENGTH) errors.message = `Keep your message under ${MAX_NOTES_LENGTH} characters.`;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const pageContext = str(raw, "pageContext");
  return {
    ok: true,
    value: {
      kind: kind as ContactRequestInput["kind"],
      fullName,
      mobile,
      subject: subject === "" ? undefined : subject,
      message: message === "" ? undefined : message,
      pageContext: pageContext === "" ? undefined : pageContext,
    },
  };
}
