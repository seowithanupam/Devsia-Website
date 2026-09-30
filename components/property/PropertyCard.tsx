import Image from "next/image";
import Link from "next/link";
import { WhatsAppIcon, buttonClassName } from "@/components/ui";
import { siteSettings } from "@/lib/content/site";
import { formatPriceLabel } from "@/lib/format";
import type { Property } from "@/lib/services/types";
import { SaveButton } from "./SaveButton";
import styles from "./property.module.css";

/** The two spec cells on a card: area and plot dimensions, when the listing has them. */
export function cardSpecs(property: Property): Array<{ value: string; label: string }> {
  const specs: Array<{ value: string; label: string }> = [];
  if (property.area) specs.push({ value: `${property.area.value} ${property.area.unit}`, label: "Area" });
  if (property.dimensions) {
    specs.push({
      value: property.dimensionsUnit ? `${property.dimensions} ${property.dimensionsUnit}` : property.dimensions,
      label: "Dimensions",
    });
  }
  if (specs.length < 2 && property.facing) specs.push({ value: property.facing, label: "Facing" });
  return specs.slice(0, 2);
}

/** WhatsApp link for a listing. INFERRED: the round icon button on the card was assumed to be WhatsApp. */
export function whatsappLinkFor(property: Pick<Property, "title" | "referenceCode">, base: string = siteSettings.whatsapp.href): string {
  const text = `Hello DevSia, I am interested in ${property.title} (${property.referenceCode}).`;
  return `${base}?text=${encodeURIComponent(text)}`;
}

/** Listing card, as in the video: photo with count and reference code, heart, details, two actions. */
/** `whatsappBase` is the WhatsApp link from Settings (the built-in one is used when not supplied). */
export function PropertyCard({ property, priority = false, whatsappBase }: { property: Property; priority?: boolean; whatsappBase?: string }) {
  const cover = property.images[0];
  const href = `/properties/${property.slug}`;
  const specs = cardSpecs(property);
  return (
    <article className={styles.card}>
      <div className={styles.media}>
        <Link href={href} tabIndex={-1} aria-hidden="true" className={styles.mediaLink}>
          {cover ? (
            <Image
              src={cover.src}
              alt=""
              fill
              sizes="(max-width: 809px) 100vw, (max-width: 1199px) 50vw, 33vw"
              className={styles.cover}
              priority={priority}
              unoptimized
            />
          ) : null}
        </Link>
        <span className={styles.photoCount}>{property.images.length} photos</span>
        <span className={styles.refCode}>{property.referenceCode}</span>
        <SaveButton slug={property.slug} title={property.title} className={styles.cardSave} />
      </div>
      <div className={styles.cardBody}>
        <div className={styles.typeLabel}>{property.typeLabel}</div>
        <div className={styles.locationCaps}>{property.location}</div>
        <h3 className={`t-title ${styles.cardTitle}`}>
          <Link href={href}>{property.title}</Link>
        </h3>
        <div className={`t-price num ${styles.price}`}>{formatPriceLabel(property.priceInr)}</div>
        {specs.length > 0 ? (
          <dl className={styles.specs}>
            {specs.map((spec) => (
              <div key={spec.label} className={styles.spec}>
                <dt>{spec.label}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <p className={styles.excerpt}>{property.description}</p>
        <div className={styles.cardActions}>
          <Link href={href} className={buttonClassName({ variant: "primary", size: "sm" })}>
            View details
          </Link>
          <Link href={`${href}#enquire`} className={buttonClassName({ variant: "outline", size: "sm" })}>
            Enquire
          </Link>
          <a
            href={whatsappLinkFor(property, whatsappBase)}
            className={styles.roundAction}
            aria-label={`WhatsApp about ${property.title}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon size={17} />
          </a>
        </div>
      </div>
    </article>
  );
}
