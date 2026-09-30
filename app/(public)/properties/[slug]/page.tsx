import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui";
import { PropertyDetail } from "@/components/property/PropertyDetail";
import { blockData, type FormIntroData } from "@/lib/cms/blocks";
import { getPageBlocks, getPropertySeo, getSiteSettings } from "@/lib/cms/public";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPropertyProvider } from "@/lib/services";
import styles from "@/components/property/property.module.css";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyProvider().getProperty(slug);
  if (!property) return { title: "Property not found", robots: { index: false } };
  // Saved override, then the property SEO template, then the Phase 2 wording (the template default reproduces it).
  const seo = await getPropertySeo(property);
  return buildMetadata({
    title: seo.title ?? `${property.title}, ${property.location}`,
    description: seo.description ?? "",
    path: `/properties/${property.slug}`,
    image: property.images[0]?.src,
    seo: { canonical: seo.canonical, ogTitle: seo.ogTitle, ogDescription: seo.ogDescription, ogImage: seo.ogImage, noIndex: seo.noIndex, noFollow: seo.noFollow },
  });
}

export default async function PropertyPage({ params }: { params: Params }) {
  const { slug } = await params;
  const property = await getPropertyProvider().getProperty(slug);
  if (!property) notFound();
  const [settings, enquireBlocks] = await Promise.all([getSiteSettings(), getPageBlocks("enquire")]);
  const enquireIntro = blockData<FormIntroData>(enquireBlocks, "form-intro");
  return (
    <Section spacing="snug">
      <Container>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/">Home</Link> / <Link href="/properties">Properties</Link> / {property.title}
        </nav>
        <PropertyDetail property={property} settings={settings} enquirySuccess={enquireIntro ? { title: enquireIntro.successTitle, text: enquireIntro.successText } : undefined} />
      </Container>
    </Section>
  );
}
