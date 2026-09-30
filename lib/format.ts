/** Formatting helpers. Pure functions, no dependencies. */

const LAKH = 100_000;
const CRORE = 10_000_000;

/** Trims trailing zeros: 26.40 -> "26.4", 44.33 -> "44.33", 35 -> "35". */
function trimNumber(value: number, maxDecimals: number): string {
  return Number(value.toFixed(maxDecimals)).toString();
}

/**
 * Price label as shown in the original: "₹26.4 L", "₹44.33 L", "₹1.95 Cr".
 * The input is rupees.
 */
export function formatPriceLabel(priceInr: number): string {
  if (priceInr >= CRORE) return `₹${trimNumber(priceInr / CRORE, 2)} Cr`;
  return `₹${trimNumber(priceInr / LAKH, 2)} L`;
}

/** Indian digit grouping for the budget placeholders: 1390000 -> "13,90,000". */
export function formatIndianNumber(value: number): string {
  const digits = Math.round(value).toString();
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last3}`;
}

/** "₹13,90,000" */
export function formatRupees(value: number): string {
  return `₹${formatIndianNumber(value)}`;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "24 August 2026" and "02 August 2026" (day is zero padded, as in the original). Input is YYYY-MM-DD. */
export function formatArticleDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return isoDate;
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return isoDate;
  return `${match[3]} ${month} ${match[1]}`;
}

/** Turns free text into a URL slug: "Nature home Tulsi 111.11gaj" -> "nature-home-tulsi-111-11gaj". */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Two-letter initials for avatars: "Amit Kumar" -> "AK", "DevSia Legal Desk" -> "DL". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
