/** Reads ?page= safely. */
export function pageNumber(raw: string | string[] | undefined): number {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(value) && value > 0 && value < 10_000 ? value : 1;
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function firstParam(raw: string | string[] | undefined, max = 100): string {
  return ((Array.isArray(raw) ? raw[0] : raw) ?? "").trim().slice(0, max);
}
