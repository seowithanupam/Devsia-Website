import { readJson, respond } from "@/lib/api/json";
import { processEnquiry } from "@/lib/forms/submission";
import { getLeadProvider } from "@/lib/services";

/** Enquiry form endpoint. Uses the MOCK lead provider; PropDesk is not connected. */
export async function POST(request: Request) {
  return respond(await processEnquiry(await readJson(request), { provider: getLeadProvider() }));
}
