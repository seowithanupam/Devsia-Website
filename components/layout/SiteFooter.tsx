import Link from "next/link";
import { getNavigation, getSiteSettings } from "@/lib/cms/public";
import { agencyCredit } from "@/lib/content/site";
import { getPropertyProvider } from "@/lib/services";
import { EMPTY_QUERY, buildPropertiesUrl } from "@/lib/services/property-filters";
import type { FacetOption } from "@/lib/services/types";
import { Logo } from "./Logo";
import styles from "./SiteFooter.module.css";

async function loadFacets(): Promise<{ types: FacetOption[]; locations: FacetOption[] }> {
  try {
    const result = await getPropertyProvider().getProperties({ ...EMPTY_QUERY, pageSize: 1 });
    return { types: result.facets.types, locations: result.facets.locations };
  } catch {
    // The footer must never break a page: fall back to no dynamic links.
    return { types: [], locations: [] };
  }
}

/**
 * Global footer. The Properties and Localities columns come from the live property facets,
 * as in the video (Plot, Farmhouse; Ajmer Road, Bhilwada Mega Highway, Diggi Road, ...).
 * The bottom of the footer carries the agency credit the client asked for
 * ("Design & Managed by Sriva Digital", opening https://srivadigital.com/ in a new tab).
 */
export async function SiteFooter() {
  const [{ types, locations }, siteSettings, nav] = await Promise.all([loadFacets(), getSiteSettings(), getNavigation()]);
  const companyLinks = nav.footerCompany.links;
  const legalLinks = nav.legal;
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div>
            <Logo inverse />
            <p className={styles.blurb}>{siteSettings.blurb}</p>
            <p className={styles.address}>
              {siteSettings.addressLines[0]}
              <br />
              {siteSettings.addressLines[1]}
            </p>
            <div className={styles.contact}>
              <a className={`${styles.phone} num`} href={`tel:${siteSettings.phone.tel}`}>
                {siteSettings.phone.display}
              </a>
              <a href={`mailto:${siteSettings.email}`}>{siteSettings.email}</a>
            </div>
            <div className={`${styles.rera} num`}>RERA {siteSettings.reraNumber}</div>
          </div>

          <nav aria-label="Properties">
            <h2 className={styles.heading}>Properties</h2>
            <ul className={styles.list}>
              {types.map((type) => (
                <li key={type.value}>
                  <Link href={buildPropertiesUrl({ types: [type.value] })}>{type.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Localities">
            <h2 className={styles.heading}>Localities</h2>
            <ul className={styles.list}>
              {locations.map((location) => (
                <li key={location.value}>
                  <Link href={buildPropertiesUrl({ locations: [location.value] })}>{location.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={nav.footerCompany.title}>
            <h2 className={styles.heading}>{nav.footerCompany.title}</h2>
            <ul className={styles.list}>
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className={`${styles.bottom} num`}>
          <span>
            © {year} {siteSettings.agencyName} · All rights reserved
          </span>
          <ul className={styles.legal}>
            {legalLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <p className={styles.disclaimer}>{siteSettings.footerDisclaimer}</p>
        <p className={styles.credit}>
          {agencyCredit.prefix}{" "}
          <a href={agencyCredit.href} target="_blank" rel="noopener noreferrer">
            {agencyCredit.name}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </div>
    </footer>
  );
}
