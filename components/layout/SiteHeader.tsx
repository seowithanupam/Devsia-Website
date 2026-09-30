import Link from "next/link";
import { ButtonLink, HeartIcon } from "@/components/ui";
import { getNavigation, getSiteSettings } from "@/lib/cms/public";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";
import styles from "./SiteHeader.module.css";

/**
 * Global header, as seen in the video: logo, Properties / Insights / About, phone, outline
 * "Become an associate", primary "Post your enquiry" and a heart linking to the wishlist.
 * It is NOT sticky in the original (the video shows it scroll away), unlike the design artifact.
 */
export async function SiteHeader() {
  const [settings, nav] = await Promise.all([getSiteSettings(), getNavigation()]);
  const primaryNav = nav.header;
  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Logo />
        <nav aria-label="Primary" className={`${styles.nav} hide-mobile`}>
          <NavLinks links={primaryNav} />
        </nav>
        <div className={styles.actions}>
          <a className={`${styles.phone} num hide-mobile`} href={`tel:${settings.phone.tel}`}>
            {settings.phone.display}
          </a>
          <ButtonLink href="/associates" variant="outline" size="sm" className="hide-tablet">
            {nav.headerButtons.associateLabel}
          </ButtonLink>
          <ButtonLink href="/enquire" size="sm" className={styles.enquire}>
            {nav.headerButtons.enquiryLabel}
          </ButtonLink>
          <Link href="/wishlist" className={styles.heart} aria-label="Wishlist">
            <HeartIcon size={17} />
          </Link>
          <MobileMenu links={primaryNav} phone={settings.phone} labels={{ enquiry: nav.headerButtons.enquiryLabel, associate: nav.headerButtons.associateLabel }} />
        </div>
      </div>
    </header>
  );
}
