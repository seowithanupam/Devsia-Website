import Link from "next/link";
import { Badge, Button, SelectField, TextField } from "@/components/ui";
import { Notice, PageHead, Pager, formatDateTime } from "@/components/admin/AdminUi";
import styles from "@/components/admin/admin.module.css";
import { requireCapability } from "@/lib/auth/session";
import { firstParam, pageCount, pageNumber } from "@/lib/cms/pagination";
import { listLeads } from "@/lib/cms/repo/leads";
import type { LeadKind } from "@/lib/cms/types";

export const metadata = { title: "Leads mirror" };
const PAGE_SIZE = 25;
const KINDS: Record<LeadKind, string> = { enquiry: "Enquiry", associate: "Associate", contact: "Contact / callback" };

export default async function LeadsAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireCapability("leads.view");
  const params = await searchParams;
  const q = firstParam(params.q, 60);
  const kindParam = firstParam(params.kind, 12);
  const kind = kindParam in KINDS ? (kindParam as LeadKind) : undefined;
  const page = pageNumber(params.page);
  const { total, items } = await listLeads({ kind, q: q || undefined, page, pageSize: PAGE_SIZE });
  return (
    <>
      <PageHead title="Leads mirror" intro="A read-only copy of what visitors submitted through the website forms." />
      <Notice tone="warn">The CRM (PropDesk) is not connected yet, so none of these have been delivered to a CRM. Do not assume anyone has followed them up.</Notice>
      <form className={styles.toolbar} action="/admin/leads" role="search">
        <div className={styles.grow}>
          <TextField label="Search" name="q" type="search" defaultValue={q} placeholder="Name, phone or page" />
        </div>
        <SelectField label="Type" name="kind" defaultValue={kind ?? ""}>
          <option value="">All</option>
          {Object.entries(KINDS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Received</th>
              <th>Type</th>
              <th>Name</th>
              <th>Phone</th>
              <th>From page</th>
              <th>CRM</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.muted}>
                  Nothing here yet.
                </td>
              </tr>
            ) : (
              items.map((lead) => (
                <tr key={lead.id}>
                  <td className={`${styles.mono} ${styles.small}`}>{formatDateTime(lead.receivedAt)}</td>
                  <td>{KINDS[lead.kind]}</td>
                  <td>
                    <Link href={`/admin/leads/${lead.id}`} className={styles.rowLink}>
                      {lead.name}
                    </Link>
                  </td>
                  <td className={styles.mono}>{lead.phone}</td>
                  <td className={styles.small}>{lead.pageEnquired || "—"}</td>
                  <td>{lead.crmStatus === "sent" ? <Badge tone="ok">Sent</Badge> : <Badge tone="gold">Not connected</Badge>}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pager basePath="/admin/leads" params={{ q, kind: kind ?? "" }} page={page} totalPages={pageCount(total, PAGE_SIZE)} total={total} noun="submission" />
    </>
  );
}
