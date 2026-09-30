import { NextResponse } from "next/server";
import type { HandlerResult } from "@/lib/forms/submission";

/** Reads a request body as JSON. Returns null when it is missing or malformed. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Turns a form handler result into an HTTP response. */
export function respond(result: HandlerResult): NextResponse {
  return NextResponse.json(result.body, { status: result.status });
}
