import { ButtonLink, Badge, CheckIcon, MapPinIcon, PhoneIcon, WhatsAppIcon } from "@/components/ui";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import type { SiteSettings } from "@/lib/content/site";
import { budgetBandForPrice } from "@/lib/services/property-filters";
import { formatPriceLabel } from "@/lib/format";
import type { Property } from "@/lib/services/types";
import { cardSpecs, whatsappLinkFor } from "./PropertyCard";
import { PropertyGallery } from "./PropertyGallery";
import { PropertyTabs } from "./PropertyTabs";
import { SaveButton } from "./SaveButton";
import styles from "./property.module.css";

function keyFacts(property: Property): Array<{ label: string; value: string }> {
  const facts: Array<{ label: string; value: string }> = [];
  if (property.area) facts.push({ label: "Area", value: `${property.area.value} ${property.area.unit}` });
  if (property.dimensions) {
    facts.push({
      label: "Dimensions",
      value: property.dimensionsUnit ? `${property.dimensions} ${property.dimensionsUnit}` : property.dimensions,
    });
  }
  if (property.facing) facts.push({ label: "Facing", value: property.facing });
  facts.push({ label: "Type", value: property.typeLabel });
  facts.push({ label: "Status", value: property.status });
  return facts;
}

/** Property detail layout: gallery, tabs (Overview, Location, Approvals) and the right-hand sidebar. */
export function PropertyDetail({ property, settings, enquirySuccess }: { property: Property; settings: SiteSettings; enquirySuccess?: { title: string; text: string } }) {
  const facts = keyFacts(property);
  const tabs = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <div className={styles.tabStack}>
          <p className={styles.description}>{property.description}</p>
          <dl className={styles.factGrid}>
            {facts.map((fact) => (
              <div key={fact.label} className={styles.fact}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
          {property.amenities.length > 0 ? (
            <div>
              <h3 className={styles.subTitle}>Amenities</h3>
              <ul className={styles.amenities}>
                {property.amenities.map((amenity) => (
                  <li key={amenity}>
                    <CheckIcon size={15} /> {amenity}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ),
    },
    {
      id: "location",
      label: "Location",
      content: (
        <div className={styles.tabStack}>
          <dl className={styles.factGrid}>
            <div className={styles.fact}>
              <dt>Area</dt>
              <dd>{`${property.location}, ${property.city}`}</dd>
            </div>
            {property.address ? (
              <div className={styles.fact}>
                <dt>Address</dt>
                <dd>{property.address}</dd>
              </div>
            ) : null}
            {property.roadAccess ? (
              <div className={styles.fact}>
                <dt>Road access</dt>
                <dd>{property.roadAccess}</dd>
              </div>
            ) : null}
          </dl>
          {property.mapsUrl ? (
            <ButtonLink href={property.mapsUrl} variant="outline" size="sm" target="_blank" rel="noopener noreferrer">
              <MapPinIcon size={15} /> View on Google Maps
            </ButtonLink>
          ) : null}
        </div>
      ),
    },
    {
      id: "approvals",
      label: "Approvals",
      content: property.approval ? (
        <ul className={styles.amenities}>
          <li>
            <CheckIcon size={15} /> {property.approval}
          </li>
        </ul>
      ) : (
        <p className={styles.description}>Approval details for this listing have not been supplied yet. Ask the advisory desk.</p>
      ),
    },
  ];

  return (
    <div className={styles.detailLayout}>
      <div className={styles.detailMain}>
        <PropertyGallery images={property.images} title={property.title} />
        <div className={styles.detailHead}>
          <div className={styles.badges}>
            {property.isNewListing ? <Badge tone="red">New listing</Badge> : null}
            <Badge tone="navy">{property.listingType}</Badge>
            <Badge tone="outline">{property.referenceCode}</Badge>
          </div>
          <div className={styles.detailTitleRow}>
            <div>
              <div className={styles.locationCaps}>
                {property.location}, {property.city}
              </div>
              <h1 className="t-h2">{property.title}</h1>
            </div>
            <SaveButton slug={property.slug} title={property.title} />
          </div>
          <div className={styles.detailPrice}>
            <span className="t-price num">{formatPriceLabel(property.priceInr)}</span>
            {property.priceType ? <span className={styles.priceType}>{property.priceType}</span> : null}
          </div>
        </div>
        <PropertyTabs tabs={tabs} />
      </div>

      <aside className={styles.sidebar} aria-label="Enquire about this property">
        <section id="enquire" className={styles.sideCard}>
          <h2 className={styles.sideTitle}>Enquire about this property</h2>
          <EnquiryForm
            variant="compact"
            successTitle={enquirySuccess?.title}
            successText={enquirySuccess?.text}
            pageEnquired={`/properties/${property.slug}`}
            defaults={{
              propertyTypes: [property.typeLabel === "Flat" ? "Flat / Apartment" : property.typeLabel],
              preferredLocation: `${property.location}, ${property.city}`,
              budgetBand: budgetBandForPrice(property.priceInr),
            }}
          />
        </section>

        <section className={styles.sideCard}>
          <h2 className={styles.sideTitle}>Advisory desk</h2>
          <div className={styles.sideActions}>
            <ButtonLink href={`tel:${settings.phone.tel}`} variant="outline" size="sm" fullWidth>
              <PhoneIcon size={15} /> Call advisor
            </ButtonLink>
            <ButtonLink href={whatsappLinkFor(property, settings.whatsapp.href)} variant="outline" size="sm" fullWidth target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon size={15} /> WhatsApp
            </ButtonLink>
            <ButtonLink href="#enquire" variant="ghost" size="sm" fullWidth>
              Request a callback
            </ButtonLink>
          </div>
        </section>

        <section className={styles.sideCard}>
          <h2 className={styles.sideTitle}>Listing details</h2>
          <dl className={styles.listingDetails}>
            <div>
              <dt>Reference</dt>
              <dd className="num">{property.referenceCode}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{property.status}</dd>
            </div>
            <div>
              <dt>Listing type</dt>
              <dd>{property.listingType}</dd>
            </div>
            {cardSpecs(property).map((spec) => (
              <div key={spec.label}>
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={styles.siteVisit}>
          <h2 className={styles.siteVisitTitle}>Book a site visit</h2>
          <p>Visit this property with an advisor. Tell us a convenient time in the enquiry form.</p>
          <ButtonLink href="#enquire" variant="onRed" size="sm">
            Book a site visit
          </ButtonLink>
        </section>
      </aside>
    </div>
  );
}
