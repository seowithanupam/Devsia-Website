import { readJson, respond } from "@/lib/api/json";
import { processAssociate } from "@/lib/forms/submission";
import { getLeadProvider } from "@/lib/services";

/** Associate application endpoint. Uses the MOCK lead provider; PropDesk is not connected. */
export async function POST(request: Request) {
  return respond(await processAssociate(await readJson(request), { provider: getLeadProvider() }));
}
