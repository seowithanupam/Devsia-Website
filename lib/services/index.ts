import { isDatabaseConfigured } from "@/lib/env";
import { withLeadMirror, type LeadMirror } from "@/lib/forms/mirror";
import type { LeadProvider } from "@/lib/forms/types";
import { createMockLeadProvider } from "./mock/lead-provider";
import { createMockPropertyProvider } from "./mock/property-provider";
import type { PropertyProvider } from "./types";

/**
 * Service registry. Every page, route and form gets its data providers from here.
 *
 * Both providers are MOCK. PropDesk is not integrated. When the CRM developer has
 * confirmed the remaining details, a PropDesk implementation of each interface is
 * added in lib/propdesk/ and selected here. Nothing else changes.
 */
const propertyProvider = createMockPropertyProvider();
const mockLeadProvider = createMockLeadProvider();

/**
 * Local copy of each accepted submission, kept in MongoDB for the admin "Leads mirror". The database code is
 * loaded only when MONGODB_URI is set, so nothing database-related runs (or is bundled into the request) otherwise.
 */
const mongoMirror: LeadMirror = {
  async record(entry) {
    const { recordLead } = await import("@/lib/cms/repo/leads");
    await recordLead(entry);
  },
};
const mirroredLeadProvider = withLeadMirror(mockLeadProvider, mongoMirror, (error) => {
  console.error("[leads mirror] could not save a copy:", error instanceof Error ? error.message : "unknown error");
});

export function getPropertyProvider(): PropertyProvider {
  return propertyProvider;
}

/**
 * Lead submissions. MOCK provider now (nothing reaches a CRM); when PropDesk is integrated it replaces
 * `mockLeadProvider` here and the mirror keeps wrapping it. With a database configured, a copy is mirrored.
 */
export function getLeadProvider(): LeadProvider {
  return isDatabaseConfigured() ? mirroredLeadProvider : mockLeadProvider;
}
