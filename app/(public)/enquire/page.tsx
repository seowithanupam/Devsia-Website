import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { FormsTabs } from "@/components/pages/FormsTabs";
import { ButtonLink, Container, PhoneIcon, Section, SectionHeading, WhatsAppIcon } from "@/components/ui";
import { blockData, type EnquirySidePanelData, type FormIntroData } from "@/lib/cms/blocks";
import { getPageBlocks, getPageSeo, getSiteSettings } from "@/lib/cms/public";
import { enquirePage } from "@/lib/content/pages";
import { buildMetadata } from "@/lib/seo/metadata";
import styles from "@/components/pages/pages.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const intro = blockData<FormIntroData>(await getPageBlocks("enquire"), "form-intro");
  return buildMetadata({ title: "Post your enquiry", description: intro?.intro ?? enquirePage.intro, path: "/enquire", seo: await getPageSeo("enquire") });
}

export default async function EnquirePage() {
  const [blocks, siteSettings] = await Promise.all([getPageBlocks("enquire"), getSiteSettings()]);
  const intro = blockData<FormIntroData>(blocks, "form-intro");
  const panel = blockData<EnquirySidePanelData>(blocks, "enquire-side-panel");
  return (
    <Section spacing="snug">
      <Container>
        <SectionHeading as="h1" label={intro?.label} title={intro?.title ?? enquirePage.title} description={intro?.intro} />
        <FormsTabs active="enquire" />
        <div className={styles.split}>
          <EnquiryForm pageEnquired="/enquire" successTitle={intro?.successTitle} successText={intro?.successText} />
          <aside className={styles.sideCard} aria-label="What happens next">
            <dl className={styles.sideList}>
              {(panel?.rows ?? []).map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd className={row.tone === "ok" ? styles.ok : undefined}>{row.value}</dd>
                </div>
              ))}
            </dl>
            <ButtonLink href={`tel:${siteSettings.phone.tel}`} variant="outline" size="sm" fullWidth>
              <PhoneIcon size={15} /> {siteSettings.phone.display}
            </ButtonLink>
            <ButtonLink href={siteSettings.whatsapp.href} variant="outline" size="sm" fullWidth target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon size={15} /> WhatsApp
            </ButtonLink>
          </aside>
        </div>
      </Container>
    </Section>
  );
}
