import Image from "next/image";
import { HeroSearch, type HeroTab } from "@/components/home/HeroSearch";
import {
  AssociateStrip,
  EnquiryCta,
  Highlights,
  InsightsPreview,
  Localities,
  TrustStrip,
  UpcomingProjects,
  WhyDevsia,
} from "@/components/home/HomeSections";
import { Container } from "@/components/ui";
import type {
  AssociateStripData,
  CopyData,
  EnquiryCtaData,
  HeroData,
  ResolvedBlock,
  TrustStripData,
  UpcomingProjectsData,
  WhyDevsiaData,
} from "@/lib/cms/blocks";
import { getPageBlocks, getPageSeo, getSiteSettings } from "@/lib/cms/public";
import { getContentProvider } from "@/lib/content";
import type { UpcomingProject } from "@/lib/content/types";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPropertyProvider } from "@/lib/services";
import { EMPTY_QUERY } from "@/lib/services/property-filters";
import styles from "@/components/home/home.module.css";

export async function generateMetadata() {
  return buildMetadata({
    title: "DevSia · Residential and plotted advisory in Jaipur",
    description: "DevSia Realty LLP: residential and plotted advisory across Jaipur.",
    path: "/",
    seo: await getPageSeo("home"),
  });
}

// Property data will come from the CRM, so the Home page is rendered per request.
export const dynamic = "force-dynamic";

async function loadHome() {
  const properties = getPropertyProvider();
  const content = getContentProvider();
  const all = await properties.getProperties({ ...EMPTY_QUERY, pageSize: 1 });
  const perType = await Promise.all(
    all.facets.types.map((type) => properties.getProperties({ ...EMPTY_QUERY, types: [type.value], pageSize: 1 })),
  );
  const featured = await properties.getProperties({ ...EMPTY_QUERY, featuredOnly: true, pageSize: 3 });
  const [blocks, latest, settings] = await Promise.all([getPageBlocks("home"), content.getLatestArticles(3), getSiteSettings()]);

  const tabs: HeroTab[] = [
    { value: "", label: "All", count: all.total, locations: all.facets.locations, priceRange: all.facets.priceRange },
    ...all.facets.types.map((type, index) => ({
      value: type.value,
      label: type.label,
      count: type.count,
      locations: perType[index].facets.locations,
      priceRange: perType[index].facets.priceRange,
    })),
  ];
  return { total: all.total, tabs, locations: all.facets.locations, featured: featured.items, latest, blocks, settings };
}

type HomeData = Awaited<ReturnType<typeof loadHome>>;

function Hero({ data, home }: { data: HeroData; home: HomeData }) {
  return (
    <section className={styles.hero}>
      <Image src="/images/home/hero.jpg" alt="" fill priority sizes="100vw" className={styles.heroImage} />
      <div className={styles.heroVeil} />
      <Container className={styles.heroInner}>
        <div className={styles.heroPill}>
          <span className={styles.heroDot} aria-hidden="true" />
          {home.total} {home.total === 1 ? "property" : "properties"} live in Jaipur
        </div>
        <h1 className="t-hero">{data.title}</h1>
        <p className={`t-lead ${styles.heroText}`}>{data.paragraph}</p>
        <HeroSearch tabs={home.tabs} />
      </Container>
    </section>
  );
}

function projectsFrom(data: UpcomingProjectsData): UpcomingProject[] {
  return data.projects.map((p) => ({
    slug: p.slug,
    name: p.name,
    kind: p.kind,
    location: p.location,
    description: p.description,
    status: p.status,
    statusTone: p.statusTone,
    priceLabel: p.priceLabel,
    image: { src: p.imageSrc, alt: p.imageAlt },
  }));
}

/** Renders one CMS block with its live data. The design of each block is fixed; the order and text come from the CMS. */
function renderBlock(block: ResolvedBlock, home: HomeData) {
  switch (block.type) {
    case "hero":
      return <Hero key={block.type} data={block.data as HeroData} home={home} />;
    case "trust-strip":
      return <TrustStrip key={block.type} data={block.data as TrustStripData} />;
    case "highlights":
      return <Highlights key={block.type} items={home.featured} copy={block.data as CopyData} whatsappBase={home.settings.whatsapp.href} />;
    case "upcoming-projects": {
      const data = block.data as UpcomingProjectsData;
      return <UpcomingProjects key={block.type} projects={projectsFrom(data)} copy={data} />;
    }
    case "localities":
      return <Localities key={block.type} locations={home.locations} copy={block.data as CopyData} />;
    case "why-devsia":
      return <WhyDevsia key={block.type} data={block.data as WhyDevsiaData} />;
    case "insights":
      return <InsightsPreview key={block.type} articles={home.latest} copy={block.data as CopyData} />;
    case "enquiry-cta":
      return <EnquiryCta key={block.type} data={block.data as EnquiryCtaData} phone={home.settings.phone} />;
    case "associate-strip":
      return <AssociateStrip key={block.type} data={block.data as AssociateStripData} />;
    default:
      return null;
  }
}

export default async function HomePage() {
  const home = await loadHome();
  return <>{home.blocks.map((block) => renderBlock(block, home))}</>;
}
