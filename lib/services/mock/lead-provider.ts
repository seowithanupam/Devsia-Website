import type { LeadProvider, SubmissionResult } from "@/lib/forms/types";

export type MockLeadProviderOptions = {
  /** Artificial delay so the "Sending…" state is visible in development. */
  delayMs?: number;
  /** Force failures, for tests. */
  fail?: boolean;
};

/**
 * Local stand-in for PropDesk lead capture and associate registration.
 * It accepts every valid submission and stores nothing: no personal data is kept or logged.
 * The real implementation replaces this later without changing any form or route.
 */
export function createMockLeadProvider({ delayMs = 700, fail = false }: MockLeadProviderOptions = {}): LeadProvider {
  async function respond(): Promise<SubmissionResult> {
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    if (fail) return { ok: false, code: "unavailable", message: "The mock provider was told to fail." };
    return { ok: true };
  }
  return {
    submitLead: respond,
    registerAssociate: respond,
    submitContactRequest: respond,
  };
}
