import type { MediaOption } from "@/components/admin/MediaPicker";
import { isDatabaseConfigured } from "@/lib/env";
import { listMedia } from "@/lib/cms/repo/media";

/** The uploaded images offered by the picker. A failure to load them never blocks an editor. */
export async function loadMediaOptions(): Promise<MediaOption[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    return (await listMedia(60)).map((m) => ({ url: m.url, alt: m.alt, filename: m.filename }));
  } catch {
    return [];
  }
}
