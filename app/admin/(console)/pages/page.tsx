import Link from "next/link";
import { Badge } from "@/components/ui";
import { PageHead, formatDateTime } from "@/components/admin/AdminUi";
import styles from "@/components/admin/admin.module.css";
import { BLOCK_DEFS, EDITABLE_PAGE_SLUGS, PAGE_DEFS } from "@/lib/cms/blocks";
import { listPages } from "@/lib/cms/repo/content";
import { requireCapability } from "@/lib/auth/session";

export const metadata = { title: "Pages" };

export default async function PagesAdmin() {
  await requireCapability("pages.manage");
  const stored = new Map((await listPages()).map((p) => [p.slug, p]));
  return (
    <>
      <PageHead title="Pages" intro="Edit the text on each page, block by block. Property listings and lead data are not edited here; they come from the CRM." />
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Page</th>
              <th>Address</th>
              <th>Blocks</th>
              <th>Last saved</th>
            </tr>
          </thead>
          <tbody>
            {EDITABLE_PAGE_SLUGS.map((slug) => {
              const page = stored.get(slug);
              return (
                <tr key={slug}>
                  <td>
                    <Link href={`/admin/pages/${slug}`} className={styles.rowLink}>
                      {PAGE_DEFS[slug].title}
                    </Link>
                  </td>
                  <td className={styles.muted}>{PAGE_DEFS[slug].path}</td>
                  <td className={styles.small}>{PAGE_DEFS[slug].allowed.map((t) => BLOCK_DEFS[t].label).join(", ")}</td>
                  <td>{page?.updatedAt ? formatDateTime(page.updatedAt) : <Badge tone="outline">Built-in content</Badge>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className={styles.hintLine} style={{ marginTop: 12 }}>
        Legal text is edited under Legal documents. Search settings are under SEO.
      </p>
    </>
  );
}
