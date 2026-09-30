/**
 * Indian mobile number handling.
 *
 * Rule from the video: the associate form rejected a 9-digit WhatsApp number with
 * "Enter a valid 10-digit WhatsApp number". So the rule is 10 digits after removing
 * spaces, dashes, brackets and an optional +91, 91 or 0 prefix. Whether the first
 * digit must be 6 to 9 is UNKNOWN, so it is not enforced.
 */
export function normalizeIndianMobile(input: string): string | null {
  let digits = input.replace(/[\s\-()]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits.length === 10 ? digits : null;
}

/** "+91" plus the 10 digits, the format the vendor PDF shows (+919876543210). */
export function toInternationalFormat(tenDigits: string): string {
  return `+91${tenDigits}`;
}
