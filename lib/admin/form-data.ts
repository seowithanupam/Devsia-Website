/** FormData -> plain object of strings (files and anything else are ignored). */
export function formToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

/** Parses a JSON string field safely. Returns undefined when it is missing or malformed. */
export function parseJsonField(value: string | undefined, maxLength = 400_000): unknown {
  if (!value || value.length > maxLength) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}
