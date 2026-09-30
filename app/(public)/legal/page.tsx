import { Container, Section, SectionHeading } from "@/components/ui";
import { getContentProvider } from "@/lib/content";
import { getPageSeo, getSiteSettings } from "@/lib/cms/public";
import { buildMetadata } from "@/lib/seo/metadata";
import styles from "@/components/pages/pages.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const settings = await getSiteSettings();
  return buildMetadata({
    title: "Privacy policy and terms of use",
    description: `Privacy policy and terms of use for ${settings.agencyName}.`,
    path: "/legal",
    seo: await getPageSeo("legal"),
  });
}

/**
 * One /legal page with a side navigation for Privacy policy and Terms of use, as in the video. The text is the
 * original's, recovered from the video. It has NOT been reviewed by a lawyer.
 */
export default async function LegalPage() {
  const documents = await getContentProvider().getLegalDocuments();
  return (
    <Section spacing="snug">
      <Container>
        <SectionHeading as="h1" label="Legal" title="Privacy policy and terms of use" />
        <div className={styles.legalLayout} style={{ marginTop: 32 }}>
          <nav aria-label="Legal documents" className={styles.legalNav}>
            {documents.map((doc) => (
              <a key={doc.id} href={`#${doc.id}`}>
                {doc.navLabel}
              </a>
            ))}
          </nav>
          <div>
            {documents.map((doc) => (
              <article key={doc.id} id={doc.id} className={styles.legalDoc}>
                <h2 className="t-h2">{doc.title}</h2>
                <p className={styles.legalMeta}>Last updated {doc.lastUpdated}</p>
                <p>{doc.intro}</p>
                {doc.sections.map((section) => (
                  <section key={section.heading}>
                    <h2>{section.heading}</h2>
                    {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    {section.bullets ? (
                      <ul>
                        {section.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}
              </article>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
