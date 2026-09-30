import { SEO_DESCRIPTION_HINT, SEO_TITLE_HINT } from "@/lib/cms/seo";
import type { SeoFields } from "@/lib/cms/types";
import { AArea, ACheck, AField } from "./AdminForm";
import { ImageField } from "./ImageField";
import type { MediaOption } from "./MediaPicker";
import styles from "./admin.module.css";

/** The SEO fields shared by pages, posts and listing overrides. `prefix` is "seo." inside the post form. */
export function SeoFieldset({ prefix = "", defaults, media }: { prefix?: string; defaults: SeoFields; media: MediaOption[] }) {
  return (
    <fieldset className={styles.fieldset}>
      <AField name={`${prefix}title`} label="Meta title" defaultValue={defaults.title} hint={`About ${SEO_TITLE_HINT} characters shows fully in search results. Leave blank to keep the built-in title.`} />
      <AArea name={`${prefix}description`} label="Meta description" rows={3} defaultValue={defaults.description} hint={`About ${SEO_DESCRIPTION_HINT} characters. Leave blank to keep the built-in description.`} />
      <AField name={`${prefix}canonical`} label="Canonical address (optional)" defaultValue={defaults.canonical} hint="Only set this when another address is the main version of the page. A site path (/about) or a full https:// address." />
      <div className={styles.grid2}>
        <AField name={`${prefix}ogTitle`} label="Social share title (Open Graph)" defaultValue={defaults.ogTitle} hint="Leave blank to use the meta title." />
        <AField name={`${prefix}ogDescription`} label="Social share description" defaultValue={defaults.ogDescription} hint="Leave blank to use the meta description." />
      </div>
      <ImageField name={`${prefix}ogImage`} label="Social share image" defaultValue={defaults.ogImage} media={media} hint="1200 × 630 works best. A site path or a full https:// address." />
      <div className={styles.grid2}>
        <ACheck name={`${prefix}noIndex`} label="Ask search engines not to list this page (noindex)" defaultChecked={defaults.noIndex} />
        <ACheck name={`${prefix}noFollow`} label="Ask search engines not to follow its links (nofollow)" defaultChecked={defaults.noFollow} />
      </div>
    </fieldset>
  );
}
