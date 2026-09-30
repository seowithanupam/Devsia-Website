import Link from "next/link";
import { saveSeoTemplateAction } from "@/app/admin/actions/seo";
import { AField, AdminForm } from "@/components/admin/AdminForm";
import { Card, PageHead } from "@/components/admin/AdminUi";
import { ImageField } from "@/components/admin/ImageField";
import styles from "@/components/admin/admin.module.css";
import { Badge } from "@/components/ui";
import { loadMediaOptions } from "@/lib/admin/media-options";
import { requireCapability } from "@/lib/auth/session";
import { PAGE_DEFS, PAGE_SLUGS } from "@/lib/cms/blocks";
import { getSeoTemplate, listPages, listPropertySeoOverrides } from "@/lib/cms/repo/content";
import { DEFAULT_PROPERTY_SEO_TEMPLATE, PROPERTY_SEO_TOKENS } from "@/lib/cms/seo";
import { getPropertyProvider } from "@/lib/services";
import { EMPTY_QUERY } from "@/lib/services/property-filters";

export const metadata = { title: "SEO" };

export default async function SeoAdmin() {
  await requireCapability("seo.manage");
  const [pages, template, overrides, listings, media] = await Promise.all([
    listPages(),
    getSeoTemplate(),
    listPropertySeoOverrides(),
    getPropertyProvider().getProperties({ ...EMPTY_QUERY, pageSize: 200 }),
    loadMediaOptions(),
  ]);
  const t = template ?? DEFAULT_PROPERTY_SEO_TEMPLATE;
  const seoBySlug = new Map(pages.map((p) => [p.slug, p.seo]));
  const overrideSlugs = new Set(overrides.map((o) => o.slug));
  return (
    <>
      <PageHead title="SEO" intro="How pages and listings appear in search results and when shared. A field left blank keeps the site's built-in wording." />
      <Card title="Pages">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Page</th>
                <th>Address</th>
                <th>Search settings</th>
              </tr>
            </thead>
            <tbody>
              {PAGE_SLUGS.map((slug) => {
                const custom = Object.keys(seoBySlug.get(slug) ?? {}).length > 0;
                return (
                  <tr key={slug}>
                    <td>
                      <Link href={`/admin/seo/pages/${slug}`} className={styles.rowLink}>
                        {PAGE_DEFS[slug].title}
                      </Link>
                    </td>
                    <td className={styles.muted}>{PAGE_DEFS[slug].path}</td>
                    <td>{custom ? <Badge tone="ok">Customised</Badge> : <Badge tone="outline">Built-in</Badge>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className={styles.hintLine}>Article SEO is set inside each article (Blog posts).</p>
      </Card>
      <Card title="Property template" help={`Used for every listing that has no override of its own. Placeholders: ${PROPERTY_SEO_TOKENS.map((x) => `{${x}}`).join("  ")}. The placeholder names are new; the original names were not recovered.`}>
        <AdminForm action={saveSeoTemplateAction} submitLabel="Save template">
          <AField name="titleTemplate" label="Title template" required defaultValue={t.titleTemplate} />
          <AField name="descriptionTemplate" label="Description template" required defaultValue={t.descriptionTemplate} />
          <ImageField name="ogImage" label="Default social share image" defaultValue={t.ogImage} media={media} />
        </AdminForm>
      </Card>
      <Card title="Listing overrides" help="Set the title, description and sharing details for one listing. The listing itself comes from the CRM.">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Listing</th>
                <th>Reference</th>
                <th>Override</th>
              </tr>
            </thead>
            <tbody>
              {listings.items.map((p) => (
                <tr key={p.slug}>
                  <td>
                    <Link href={`/admin/seo/property/${p.slug}`} className={styles.rowLink}>
                      {p.title}
                    </Link>
                  </td>
                  <td className={styles.mono}>{p.referenceCode}</td>
                  <td>{overrideSlugs.has(p.slug) ? <Badge tone="ok">Has override</Badge> : <Badge tone="outline">Uses template</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
