/**
 * Option lists for the forms. Labels come from the live forms in the video. Where the
 * vendor PDF lists the same value, the strings are identical. Marked ASSUMED where the
 * video did not show the full list.
 */

export const PROPERTY_TYPE_OPTIONS = ["Plot", "Flat / Apartment", "Villa", "Commercial", "Farmhouse"] as const;

export const BUDGET_OPTIONS = [
  { value: "under-25l", label: "Under ₹25L" },
  { value: "25-50l", label: "₹25–50L" },
  { value: "50l-1cr", label: "₹50L – ₹1 Cr" },
  { value: "1-2cr", label: "₹1 – 2 Cr" },
  { value: "2cr-plus", label: "₹2 Cr+" },
] as const;

export const PURPOSE_OPTIONS = ["Self Use", "Investment", "Rental"] as const;

export const TIMELINE_OPTIONS = ["Within 15 Days", "15–30 Days", "1–3 Months", "3–6 Months", "Just Exploring"] as const;

export const SITE_VISIT_OPTIONS = ["Yes, this week", "Yes, later", "Not yet"] as const;

/**
 * ASSUMED: the video shows "No preference" as the first option. The vendor PDF gives
 * Morning, Afternoon and Evening as examples, so those are offered.
 */
export const CALL_TIME_OPTIONS = ["No preference", "Morning", "Afternoon", "Evening"] as const;

export const EXPERIENCE_OPTIONS = ["Fresher", "Less than 1 Year", "1–3 Years", "3+ Years"] as const;

export const ASSOCIATE_PROPERTY_TYPE_OPTIONS = ["Residential", "Commercial", "Plots", "Villas", "Multiple"] as const;

export const DEALS_CLOSED_OPTIONS = ["0", "1–3", "4–10", "10+"] as const;

/**
 * ASSUMED: the video shows only "General enquiry" as the selected Subject. The other
 * options are placeholders until the original list is confirmed.
 */
export const CONTACT_SUBJECT_OPTIONS = [
  "General enquiry",
  "Property enquiry",
  "Associate or partnership",
  "Legal and documentation",
] as const;
