import { Button, SelectField, TextField } from "@/components/ui";
import { PageHead, Pager, formatDateTime } from "@/components/admin/AdminUi";
import styles from "@/components/admin/admin.module.css";
import { requireCapability } from "@/lib/auth/session";
import { firstParam, pageCount, pageNumber } from "@/lib/cms/pagination";
import { listAudit } from "@/lib/cms/repo/audit";

export const metadata = { title: "Audit log" };
const PAGE_SIZE = 40;
const GROUPS = [
  ["auth.", "Sign-ins"],
  ["page.", "Pages"],
  ["post.", "Blog posts"],
  ["nav.", "Navigation"],
  ["settings.", "Settings"],
  ["seo.", "SEO"],
  ["legal.", "Legal documents"],
  ["media.", "Media"],
  ["user.", "Staff accounts"],
  ["profile.", "Profiles"],
  ["content.", "Content restore"],
] as const;

export default async function AuditAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireCapability("audit.view");
  const params = await searchParams;
  const q = firstParam(params.q, 80);
  const groupParam = firstParam(params.action, 20);
  const action = GROUPS.some(([prefix]) => prefix === groupParam) ? groupParam : undefined;
  const page = pageNumber(params.page);
  const { total, items } = await listAudit({ action, q: q || undefined, page, pageSize: PAGE_SIZE });
  return (
    <>
      <PageHead title="Audit log" intro="Who changed what, and when. Entries record which fields changed, never their values, passwords or personal details." />
      <form className={styles.toolbar} action="/admin/audit" role="search">
        <div className={styles.grow}>
          <TextField label="Search" name="q" type="search" defaultValue={q} placeholder="Email, summary or item" />
        </div>
        <SelectField label="Area" name="action" defaultValue={action ?? ""}>
          <option value="">Everything</option>
          {GROUPS.map(([prefix, label]) => (
            <option key={prefix} value={prefix}>
              {label}
            </option>
          ))}
        </SelectField>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>When</th>
              <th>Who</th>
              <th>Action</th>
              <th>What</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.muted}>
                  Nothing recorded yet.
                </td>
              </tr>
            ) : (
              items.map((a) => (
                <tr key={a.id}>
                  <td className={`${styles.mono} ${styles.small}`}>{formatDateTime(a.at)}</td>
                  <td className={styles.small}>
                    {a.actorEmail || "system"}
                    {a.actorRole ? <div className={styles.muted}>{a.actorRole}</div> : null}
                  </td>
                  <td className={`${styles.mono} ${styles.small}`}>{a.action}</td>
                  <td>{a.summary}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pager basePath="/admin/audit" params={{ q, action: action ?? "" }} page={page} totalPages={pageCount(total, PAGE_SIZE)} total={total} noun="entry" />
    </>
  );
}
