import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, Badge, ButtonLink, CheckIcon, Container, Label, Section, SectionHeading } from "@/components/ui";
import { PropertyCard } from "@/components/property/PropertyCard";
import { ArticleCard } from "@/components/insights/ArticleCard";
import { NEW_PROJECTS_LIVE } from "@/lib/config/features";
import type { AssociateStripData, CopyData, EnquiryCtaData, TrustStripData, WhyDevsiaData } from "@/lib/cms/blocks";
import type { Article, UpcomingProject } from "@/lib/content/types";
import { buildPropertiesUrl } from "@/lib/services/property-filters";
import type { FacetOption, Property } from "@/lib/services/types";
import styles from "./home.module.css";

export function TrustStrip({ data }: { data: TrustStripData }) {
  return (
    <Section spacing="tight" tone="tint" aria-label="Why buyers trust DevSia">
      <Container>
        <ul className={styles.trust}>
          {data.items.map((item) => (
            <li key={item.value}>
              <div className={styles.trustValue}>{item.value}</div>
              <div className={styles.trustCaption}>{item.caption}</div>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/** Rendered only when a listing is featured. The live site showed no Highlights section, so nothing appears until PropDesk marks one. */
export function Highlights({ items, copy, whatsappBase }: { items: Property[]; copy: CopyData; whatsappBase?: string }) {
  if (items.length === 0) return null;
  return (
    <Section>
      <Container>
        <SectionHeading label={copy.label} title={copy.title} description={copy.description} />
        <ul className={styles.cardGrid}>
          {items.map((property) => (
            <li key={property.id}>
              <PropertyCard property={property} whatsappBase={whatsappBase} />
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/**
 * Upcoming projects. PLACEHOLDER content (see lib/content/upcoming.ts). "Register interest" opens the
 * enquiry page: the CRM has no documented endpoint for it. The design's "Download brochure" is left out
 * because no brochure files exist.
 */
export function UpcomingProjects({ projects, copy, headingAs = "h2" }: { projects: UpcomingProject[]; copy: CopyData; headingAs?: "h1" | "h2" }) {
  if (projects.length === 0) return null;
  return (
    <Section tone="tint">
      <Container>
        <div className={styles.headRow}>
          <SectionHeading as={headingAs} label={copy.label} title={copy.title} description={copy.description} />
          {NEW_PROJECTS_LIVE ? (
            <ButtonLink href="/new-projects" variant="outline" size="sm">
              All new projects
            </ButtonLink>
          ) : null}
        </div>
        <ul className={styles.projectGrid}>
          {projects.map((project) => (
            <li key={project.slug} className={styles.project}>
              <div className={styles.projectMedia}>
                <Image src={project.image.src} alt={project.image.alt} fill sizes="(max-width: 809px) 100vw, 33vw" className={styles.projectImage} />
                <Badge tone={project.statusTone} className={styles.projectStatus}>
                  {project.status}
                </Badge>
              </div>
              <div className={styles.projectBody}>
                <div className={styles.projectKind}>
                  {project.kind} · {project.location}
                </div>
                <h3 className="t-title">{project.name}</h3>
                <p className={styles.projectText}>{project.description}</p>
                <div className={styles.projectFoot}>
                  <span className={`${styles.projectPrice} num`}>{project.priceLabel}</span>
                  <ButtonLink href="/enquire" variant="outline" size="sm">
                    Register interest
                  </ButtonLink>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/**
 * Localities tiles. The original design showed fixed placeholder localities with made-up counts;
 * the video showed the site's real locations. These tiles are built from the live location facets,
 * so counts are always true. This is a documented deviation from the design artifact.
 */
export function Localities({ locations, copy }: { locations: FacetOption[]; copy: CopyData }) {
  if (locations.length === 0) return null;
  return (
    <Section>
      <Container>
        <SectionHeading label={copy.label} title={copy.title} />
        <ul className={styles.localities}>
          {locations.map((location) => (
            <li key={location.value}>
              <Link href={buildPropertiesUrl({ locations: [location.value] })} className={styles.locality}>
                <span className={styles.localityName}>{location.label}</span>
                <span className={styles.localityCount}>
                  {location.count} {location.count === 1 ? "property" : "properties"}
                </span>
                <ArrowRightIcon size={16} />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/** Why DevSia. The claims, quote and credentials are unverified placeholders carried over from the original. */
export function WhyDevsia({ data: whyDevsia }: { data: WhyDevsiaData }) {
  return (
    <Section tone="navy">
      <Container>
        <SectionHeading label={whyDevsia.label} labelTone="onNavy" title={whyDevsia.title} />
        <div className={styles.whyLayout}>
          <ol className={styles.whyPoints}>
            {whyDevsia.points.map((point, index) => (
              <li key={point.title}>
                <span className={styles.whyNumber}>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className={styles.whyTitle}>{point.title}</h3>
                  <p className={styles.whyText}>{point.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className={styles.whyAside}>
            <figure className={styles.quote}>
              <blockquote className="t-quote">“{whyDevsia.quote.text}”</blockquote>
              <figcaption>
                <strong>{whyDevsia.quote.name}</strong>
                <span>{whyDevsia.quote.caption}</span>
              </figcaption>
            </figure>
            <ul className={styles.credentials}>
              {whyDevsia.credentials.map((credential) => (
                <li key={credential.label}>
                  <CheckIcon size={15} />
                  <span>{credential.label}</span>
                  <strong>{credential.value}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/** Insights preview: the latest article on a navy card first, then the next two. */
export function InsightsPreview({ articles, copy }: { articles: Article[]; copy: CopyData }) {
  if (articles.length === 0) return null;
  return (
    <Section>
      <Container>
        <div className={styles.headRow}>
          <SectionHeading label={copy.label} title={copy.title} />
          <ButtonLink href="/insights" variant="outline" size="sm">
            All insights
          </ButtonLink>
        </div>
        <ul className={styles.cardGrid}>
          {articles.map((article, index) => (
            <li key={article.slug}>
              <ArticleCard article={article} tone={index === 0 ? "navy" : "light"} />
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/** Enquiry CTA: promise copy on the left, one panel on the right linking to /enquire (as in the video). */
export function EnquiryCta({ data: enquiryCta, phone }: { data: EnquiryCtaData; phone: { display: string; tel: string } }) {
  return (
    <Section tone="tint" aria-labelledby="enquiry-cta-title">
      <Container>
        <div className={styles.ctaLayout}>
          <div>
            <Label tone="red">{enquiryCta.label}</Label>
            <h2 className="t-h2-cta" id="enquiry-cta-title">
              {enquiryCta.title}
            </h2>
            <p className="t-body">{enquiryCta.description}</p>
            <ul className={styles.promises}>
              {enquiryCta.promises.map((promise) => (
                <li key={promise}>
                  <CheckIcon size={16} /> {promise}
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.ctaPanel}>
            <h3 className={styles.ctaPanelTitle}>{enquiryCta.panelTitle}</h3>
            <ButtonLink href="/enquire" fullWidth>
              {enquiryCta.panelButton}
            </ButtonLink>
            <p className={styles.ctaContact}>
              Or call <a href={`tel:${phone.tel}`}>{phone.display}</a>
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export function AssociateStrip({ data: associateStrip }: { data: AssociateStripData }) {
  return (
    <Section tone="red" spacing="tight" aria-labelledby="associate-strip-title">
      <Container>
        <div className={styles.associate}>
          <div>
            <h2 className={styles.associateTitle} id="associate-strip-title">
              {associateStrip.title}
            </h2>
            <p className={styles.associateText}>{associateStrip.text}</p>
          </div>
          <ButtonLink href="/associates" variant="onRed">
            {associateStrip.button}
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
