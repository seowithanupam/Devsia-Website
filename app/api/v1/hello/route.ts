import { NextResponse } from "next/server";

/** Health check. The handover lists a /api/v1/hello endpoint; its response shape is not documented, so this is minimal. */
export function GET() {
  return NextResponse.json({ status: "ok" });
}
