import { restoreDefaultsAction } from "@/app/admin/actions/content";
import { saveSettingsAction } from "@/app/admin/actions/settings";
import { AArea, AField, AdminForm } from "@/components/admin/AdminForm";
import { Card, Notice, PageHead } from "@/components/admin/AdminUi";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import styles from "@/components/admin/admin.module.css";
import { requireCapability } from "@/lib/auth/session";
import { getSettingsRecord } from "@/lib/cms/repo/content";
import { DEFAULT_SETTINGS_RECORD } from "@/lib/cms/settings";

export const metadata = { title: "Settings" };

export default async function SettingsAdmin() {
  await requireCapability("settings.manage");
  const s = { ...DEFAULT_SETTINGS_RECORD, ...((await getSettingsRecord()) ?? {}) };
  return (
    <>
      <PageHead title="Settings" intro="Agency contact details used across the site: the header, footer, contact panels, property pages and WhatsApp links." />
      <Notice tone="warn">These contact details and the RERA number are the ones shown in the original site&apos;s recording. They have not been confirmed by the client. Check every value before launch.</Notice>
      <AdminForm action={saveSettingsAction} submitLabel="Save settings">
        <Card title="Agency">
          <AField name="agencyName" label="Agency name" required defaultValue={s.agencyName} />
          <AArea name="blurb" label="Footer description" rows={2} defaultValue={s.blurb} />
          <AField name="reraNumber" label="RERA number" required defaultValue={s.reraNumber} />
        </Card>
        <Card title="Contact" help="Call and WhatsApp links are built from the numbers you type.">
          <div className={styles.grid2}>
            <AField name="phoneDisplay" label="Phone" required defaultValue={s.phoneDisplay} hint="For example +91 141 4000 900" />
            <AField name="whatsappDisplay" label="WhatsApp" required defaultValue={s.whatsappDisplay} />
            <AField name="email" label="Advisory email" required type="email" defaultValue={s.email} />
            <AField name="privacyEmail" label="Privacy email" required type="email" defaultValue={s.privacyEmail} />
          </div>
          <div className={styles.grid2}>
            <AField name="addressLine1" label="Address line 1" required defaultValue={s.addressLine1} />
            <AField name="addressLine2" label="Address line 2" required defaultValue={s.addressLine2} />
            <AField name="hoursWeekdays" label="Weekday hours" required defaultValue={s.hoursWeekdays} />
            <AField name="hoursSunday" label="Sunday hours" required defaultValue={s.hoursSunday} />
          </div>
        </Card>
        <Card title="Partner desk">
          <div className={styles.grid2}>
            <AField name="partnerPhone" label="Partner desk phone" required defaultValue={s.partnerPhone} />
            <AField name="partnerEmail" label="Partner desk email" required type="email" defaultValue={s.partnerEmail} />
          </div>
        </Card>
        <Card title="Footer notice">
          <AArea name="footerDisclaimer" label="Disclaimer" rows={3} defaultValue={s.footerDisclaimer} />
        </Card>
      </AdminForm>
      <Card title="Restore built-in content" help="Adds back any built-in page, article, legal text, navigation or setting that has gone missing. It never overwrites anything you have edited.">
        <AdminForm action={restoreDefaultsAction} hideSubmit>
          <div>
            <ConfirmSubmit variant="outline" message="Restore any missing built-in content?">
              Restore missing defaults
            </ConfirmSubmit>
          </div>
        </AdminForm>
      </Card>
    </>
  );
}
