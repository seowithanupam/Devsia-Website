import { siteSettings, type SiteSettings } from "@/lib/content/site";
import type { SettingsRecord } from "./types";
import { cleanSingleLine, cleanString, hasErrors, isValidEmail, type FieldErrors } from "./validate";

/**
 * Turns a phone number as people type it into the pieces the site needs.
 * "+91 141 4000 900" -> tel "+911414000900", digits "911414000900".
 * A 10-digit number gets the India code 91. Returns null when it is not a plausible number.
 */
export function normalizePhone(display: string): { tel: string; digits: string } | null {
  let digits = display.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.length < 11 || digits.length > 15) return null;
  return { tel: `+${digits}`, digits };
}

export const DEFAULT_SETTINGS_RECORD: SettingsRecord = {
  agencyName: siteSettings.agencyName,
  blurb: siteSettings.blurb,
  phoneDisplay: siteSettings.phone.display,
  whatsappDisplay: siteSettings.whatsapp.display,
  email: siteSettings.email,
  privacyEmail: siteSettings.privacyEmail,
  addressLine1: siteSettings.addressLines[0],
  addressLine2: siteSettings.addressLines[1],
  reraNumber: siteSettings.reraNumber,
  hoursWeekdays: siteSettings.hours.weekdays,
  hoursSunday: siteSettings.hours.sunday,
  partnerPhone: siteSettings.partnerDesk.phone,
  partnerEmail: siteSettings.partnerDesk.email,
  footerDisclaimer: siteSettings.footerDisclaimer,
};

/** The full settings object the site uses. A missing record means the built-in defaults; derived links are always recomputed. */
export function settingsFromRecord(record: Partial<SettingsRecord> | null | undefined): SiteSettings {
  const r: SettingsRecord = { ...DEFAULT_SETTINGS_RECORD, ...(record ?? {}) };
  const phone = normalizePhone(r.phoneDisplay) ?? { tel: siteSettings.phone.tel, digits: "" };
  const wa = normalizePhone(r.whatsappDisplay);
  const partner = normalizePhone(r.partnerPhone) ?? { tel: siteSettings.partnerDesk.tel, digits: "" };
  return {
    brand: siteSettings.brand,
    agencyName: r.agencyName,
    blurb: r.blurb,
    phone: { display: r.phoneDisplay, tel: phone.tel },
    whatsapp: { display: r.whatsappDisplay, href: wa ? `https://wa.me/${wa.digits}` : siteSettings.whatsapp.href },
    email: r.email,
    privacyEmail: r.privacyEmail,
    addressLines: [r.addressLine1, r.addressLine2],
    addressOneLine: `${r.addressLine1} ${r.addressLine2}`.replace(/\s+/g, " ").trim(),
    reraNumber: r.reraNumber,
    hours: { weekdays: r.hoursWeekdays, sunday: r.hoursSunday },
    partnerDesk: { phone: r.partnerPhone, tel: partner.tel, email: r.partnerEmail },
    footerDisclaimer: r.footerDisclaimer,
  };
}

export type SettingsValidation = { ok: true; value: SettingsRecord } | { ok: false; errors: FieldErrors };

export function validateSettingsInput(input: Record<string, unknown>): SettingsValidation {
  const errors: FieldErrors = {};
  const need = (key: keyof SettingsRecord, max: number, label: string) => {
    const v = cleanSingleLine(input[key], max);
    if (!v) errors[key] = `Enter ${label}.`;
    return v;
  };
  const email = (key: "email" | "privacyEmail" | "partnerEmail", label: string) => {
    const v = cleanSingleLine(input[key], 254).toLowerCase();
    if (!isValidEmail(v)) errors[key] = `Enter a valid ${label}.`;
    return v;
  };
  const phone = (key: "phoneDisplay" | "whatsappDisplay" | "partnerPhone", label: string) => {
    const v = cleanSingleLine(input[key], 30);
    if (!normalizePhone(v)) errors[key] = `Enter a valid ${label} (10 to 15 digits, for example +91 141 4000 900).`;
    return v;
  };

  const value: SettingsRecord = {
    agencyName: need("agencyName", 100, "the agency name"),
    blurb: cleanString(input.blurb, 300),
    phoneDisplay: phone("phoneDisplay", "phone number"),
    whatsappDisplay: phone("whatsappDisplay", "WhatsApp number"),
    email: email("email", "email address"),
    privacyEmail: email("privacyEmail", "privacy email address"),
    addressLine1: need("addressLine1", 120, "the first address line"),
    addressLine2: need("addressLine2", 120, "the second address line"),
    reraNumber: need("reraNumber", 60, "the RERA number"),
    hoursWeekdays: need("hoursWeekdays", 80, "the weekday hours"),
    hoursSunday: need("hoursSunday", 80, "the Sunday hours"),
    partnerPhone: phone("partnerPhone", "partner desk phone"),
    partnerEmail: email("partnerEmail", "partner desk email"),
    footerDisclaimer: cleanString(input.footerDisclaimer, 400),
  };
  return hasErrors(errors) ? { ok: false, errors } : { ok: true, value };
}
