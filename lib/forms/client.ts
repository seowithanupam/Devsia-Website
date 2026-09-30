import type { FieldErrors } from "./types";

/** What the browser learned from sending a form. */
export type SendOutcome =
  | { kind: "ok" }
  | { kind: "invalid"; errors: FieldErrors }
  | { kind: "failed" };

/** POSTs JSON to one of the site's own routes and maps the response to a SendOutcome. */
export async function postJson(url: string, payload: unknown): Promise<SendOutcome> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.ok) return { kind: "ok" };
    if (response.status === 422) {
      const data: unknown = await response.json().catch(() => null);
      const errors = extractErrors(data);
      return errors ? { kind: "invalid", errors } : { kind: "failed" };
    }
    return { kind: "failed" };
  } catch {
    return { kind: "failed" };
  }
}

/** Maps the JSON a server action returns to a SendOutcome. */
export function outcomeFromActionResult(result: unknown): SendOutcome {
  if (typeof result !== "object" || result === null) return { kind: "failed" };
  const r = result as { ok?: unknown; errors?: unknown };
  if (r.ok === true) return { kind: "ok" };
  const errors = extractErrors(r);
  return errors ? { kind: "invalid", errors } : { kind: "failed" };
}

function extractErrors(data: unknown): FieldErrors | null {
  if (typeof data !== "object" || data === null) return null;
  const errors = (data as { errors?: unknown }).errors;
  if (typeof errors !== "object" || errors === null) return null;
  const clean: FieldErrors = {};
  for (const [key, value] of Object.entries(errors)) {
    if (typeof value === "string") clean[key] = value;
  }
  return Object.keys(clean).length > 0 ? clean : null;
}
