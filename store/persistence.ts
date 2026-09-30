/** localStorage persistence for the wishlist. Every call is wrapped: storage can be blocked or full. */
export const WISHLIST_STORAGE_KEY = "devsia:wishlist:v1";

export function parseStoredWishlist(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item !== "");
  } catch {
    return [];
  }
}

export function loadWishlist(storage: Pick<Storage, "getItem"> | null = safeStorage()): string[] {
  if (!storage) return [];
  try {
    return parseStoredWishlist(storage.getItem(WISHLIST_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function saveWishlist(slugs: string[], storage: Pick<Storage, "setItem"> | null = safeStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // Storage may be unavailable (private mode, quota). The wishlist then lasts for this visit only.
  }
}

function safeStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
