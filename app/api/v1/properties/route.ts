import { NextResponse } from "next/server";
import { parsePropertySearchParams } from "@/lib/services/property-filters";
import { getPropertyProvider } from "@/lib/services";

const MAX_SLUGS = 50;

/**
 * Listing endpoint used by the wishlist page. `slugs` is a comma separated list; all other
 * parameters are the same as /properties. Backed by the MOCK provider.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const raw: Record<string, string[]> = {};
  for (const key of new Set(params.keys())) raw[key] = params.getAll(key);
  const query = parsePropertySearchParams(raw);
  const slugParam = params.get("slugs");
  if (slugParam !== null) {
    query.slugs = slugParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, MAX_SLUGS);
    query.pageSize = MAX_SLUGS;
  }
  try {
    const result = await getPropertyProvider().getProperties(query);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: false, error: "Could not load properties." }, { status: 502 });
  }
}
