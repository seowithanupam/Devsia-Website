"use server";

import { processContactRequest } from "@/lib/forms/submission";
import { getLeadProvider } from "@/lib/services";

/**
 * Server action for the About page contact form and the "Request a callback" forms.
 * The vendor PDF documents no endpoint for these, so it goes to the MOCK provider only.
 */
export async function sendContactRequest(payload: unknown) {
  const result = await processContactRequest(payload, { provider: getLeadProvider() });
  return result.body;
}
