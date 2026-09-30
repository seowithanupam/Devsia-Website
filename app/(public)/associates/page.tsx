import { AssociateForm } from "@/components/forms/AssociateForm";
import { FormsTabs } from "@/components/pages/FormsTabs";
import { ButtonLink, Container, MailIcon, PhoneIcon, Section, SectionHeading } from "@/components/ui";
import { blockData, type FormIntroData } from "@/lib/cms/blocks";
import { getPageBlocks, getPageSeo, getSiteSettings } from "@/lib/cms/public";
import { associatesPage } from "@/lib/content/pages";
import { buildMetadata } from "@/lib/seo/metadata";
import styles from "@/components/pages/pages.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const intro = blockData<FormIntroData>(await getPageBlocks("associates"), "form-intro");
  return buildMetadata({ title: "Become an associate", description: intro?.intro ?? associatesPage.intro, path: "/associates", seo: await getPageSeo("associates") });
}

export default async function AssociatesPage() {
  const [blocks, siteSettings] = await Promise.all([getPageBlocks("associates"), getSiteSettings()]);
  const intro = blockData<FormIntroData>(blocks, "form-intro");
  return (
    <Section spacing="snug">
      <Container>
        <SectionHeading as="h1" label={intro?.label} title={intro?.title ?? associatesPage.title} description={intro?.intro} />
        <FormsTabs active="associates" />
        <div className={styles.split}>
          <AssociateForm successTitle={intro?.successTitle} successText={intro?.successText} />
          <aside className={styles.sideCard} aria-label="Partner desk">
            <h2 className="t-title">Partner desk</h2>
            <ButtonLink href={`tel:${siteSettings.partnerDesk.tel}`} variant="outline" size="sm" fullWidth>
              <PhoneIcon size={15} /> {siteSettings.partnerDesk.phone}
            </ButtonLink>
            <ButtonLink href={`mailto:${siteSettings.partnerDesk.email}`} variant="outline" size="sm" fullWidth>
              <MailIcon size={15} /> {siteSettings.partnerDesk.email}
            </ButtonLink>
          </aside>
        </div>
      </Container>
    </Section>
  );
}
