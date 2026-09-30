import { saveLegalAction } from "@/app/admin/actions/legal";
import { AArea, AField, AdminForm } from "@/components/admin/AdminForm";
import { Card, Notice, PageHead } from "@/components/admin/AdminUi";
import styles from "@/components/admin/admin.module.css";
import { requireCapability } from "@/lib/auth/session";
import { DEFAULT_LEGAL_RECORDS } from "@/lib/cms/legal";
import { listLegalRecords } from "@/lib/cms/repo/content";

export const metadata = { title: "Legal documents" };

export default async function LegalAdmin() {
  await requireCapability("pages.manage");
  const stored = await listLegalRecords();
  const records = DEFAULT_LEGAL_RECORDS.map((d) => stored.find((s) => s.slug === d.slug) ?? d);
  return (
    <>
      <PageHead title="Legal documents" intro="The privacy policy and terms of use shown on the /legal page." />
      <Notice tone="warn">The wording that shipped with this site was drafted by the previous developer and has not been reviewed by a lawyer. Have it reviewed before launch.</Notice>
      {records.map((record) => (
        <Card key={record.slug} title={record.title}>
          <AdminForm action={saveLegalAction} submitLabel={`Save ${record.navLabel.toLowerCase()}`}>
            <input type="hidden" name="slug" value={record.slug} />
            <div className={styles.grid3}>
              <AField name="navLabel" label="Menu label" required defaultValue={record.navLabel} />
              <AField name="title" label="Title" required defaultValue={record.title} />
              <AField name="lastUpdated" label="Last updated" required defaultValue={record.lastUpdated} hint="Shown as “Last updated …”. Update it when the text changes." />
            </div>
            <AArea name="intro" label="Introduction" required rows={4} defaultValue={record.intro} />
            <AArea name="body" label="Sections" required rows={22} mono defaultValue={record.body} hint="Start each section with a line like “## What we collect”. Then paragraphs (separated by a blank line) and bullet lines starting with “- ”." />
          </AdminForm>
        </Card>
      ))}
    </>
  );
}
