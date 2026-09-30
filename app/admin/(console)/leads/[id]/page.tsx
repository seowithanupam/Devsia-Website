import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui";
import { Card, PageHead, formatDateTime } from "@/components/admin/AdminUi";
import styles from "@/components/admin/admin.module.css";
import { requireCapability } from "@/lib/auth/session";
import { getLead } from "@/lib/cms/repo/leads";

export const metadata = { title: "Submission" };

function show(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export default async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability("leads.view");
  const lead = await getLead((await params).id);
  if (!lead) notFound();
  return (
    <>
      <PageHead title={lead.name} intro={`Received ${formatDateTime(lead.receivedAt)}`} actions={<ButtonLink href="/admin/leads" variant="outline" size="sm">Back to the list</ButtonLink>} />
      <Card title="What was submitted" help="Read-only. Work the actual lead in the CRM once it is connected.">
        <dl style={{ display: "grid", gap: 10, margin: 0 }}>
          {Object.entries(lead.payload).map(([key, value]) => (
            <div key={key} style={{ display: "grid", gridTemplateColumns: "minmax(120px, 200px) minmax(0, 1fr)", gap: 12 }}>
              <dt className={styles.muted}>{key}</dt>
              <dd style={{ margin: 0, overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>{show(value)}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <Card title="Where it came from">
        <p className={styles.small}>Page: {lead.pageEnquired || "—"} · Source: {lead.source} · CRM: {lead.crmStatus === "sent" ? "sent" : "not connected"}</p>
      </Card>
    </>
  );
}
