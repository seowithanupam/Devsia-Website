import type { AssociateInput, ContactRequestInput, EnquiryInput, LeadProvider, SubmissionMeta, SubmissionResult } from "./types";
import type { LeadKind } from "@/lib/cms/types";

/**
 * Leads mirror.
 *
 * The handover says a copy of each submission is kept in this site's own database "for visibility only",
 * written AFTER the CRM accepts it, and that a failed mirror write never shows the visitor an error.
 *
 * PropDesk is not integrated yet, so the "CRM" here is the mock provider. The mirror is a decorator around
 * whichever LeadProvider is in use: when PropDesk is added later it wraps that provider the same way, and
 * nothing in the forms or routes changes.
 */

export type LeadMirrorEntry = {
  kind: LeadKind;
  name: string;
  phone: string;
  payload: Record<string, unknown>;
  pageEnquired: string;
};

export interface LeadMirror {
  record(entry: LeadMirrorEntry): Promise<void>;
}

export function withLeadMirror(inner: LeadProvider, mirror: LeadMirror | null, onMirrorError?: (error: unknown) => void): LeadProvider {
  if (!mirror) return inner;

  async function mirrored(result: SubmissionResult, entry: LeadMirrorEntry): Promise<SubmissionResult> {
    if (result.ok) {
      try {
        await mirror!.record(entry);
      } catch (error) {
        // A mirror failure must never change what the visitor sees.
        onMirrorError?.(error);
      }
    }
    return result;
  }

  return {
    async submitLead(input: EnquiryInput, meta: SubmissionMeta) {
      const result = await inner.submitLead(input, meta);
      return mirrored(result, { kind: "enquiry", name: input.fullName, phone: input.mobile, payload: { ...input }, pageEnquired: meta.pageEnquired ?? "" });
    },
    async registerAssociate(input: AssociateInput, meta: SubmissionMeta) {
      const result = await inner.registerAssociate(input, meta);
      return mirrored(result, { kind: "associate", name: input.fullName, phone: input.mobile, payload: { ...input }, pageEnquired: meta.pageEnquired ?? "" });
    },
    async submitContactRequest(input: ContactRequestInput, meta: SubmissionMeta) {
      const result = await inner.submitContactRequest(input, meta);
      return mirrored(result, { kind: "contact", name: input.fullName, phone: input.mobile, payload: { ...input }, pageEnquired: meta.pageEnquired ?? input.pageContext ?? "" });
    },
  };
}
