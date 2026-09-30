import Link from "next/link";
import { Container, Section } from "@/components/ui";
import { FilterPanel } from "@/components/property/FilterPanel";
import { EmptyListing, ListingError } from "@/components/property/ListingState";
import { Pagination } from "@/components/property/Pagination";
import { PropertyGrid } from "@/components/property/PropertyGrid";
import { blockData, type ListingHeroData } from "@/lib/cms/blocks";
import { getPageBlocks, getPageSeo, getSiteSettings } from "@/lib/cms/public";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPropertyProvider } from "@/lib/services";
import { parsePropertySearchParams } from "@/lib/services/property-filters";
import type { PropertyListResult } from "@/lib/services/types";
import styles from "@/components/property/property.module.css";

export async function generateMetadata() {
  return buildMetadata({
    title: "Property for sale in Jaipur",
    description: "Browse plots and farmhouses for sale in Jaipur, with filters for location, type and budget.",
    path: "/properties",
    seo: await getPageSeo("properties"),
  });
}

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PropertiesPage({ searchParams }: { searchParams: SearchParams }) {
  const query = parsePropertySearchParams(await searchParams);
  const [blocks, settings] = await Promise.all([getPageBlocks("properties"), getSiteSettings()]);
  const hero = blockData<ListingHeroData>(blocks, "listing-hero") ?? { title: "Property for sale in Jaipur", breadcrumb: "Property for sale" };
  let result: PropertyListResult | null = null;
  try {
    result = await getPropertyProvider().getProperties(query);
  } catch {
    result = null;
  }

  return (
    <Section spacing="snug">
      <Container>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/">Home</Link> / Jaipur / {hero.breadcrumb}
        </nav>
        <div className={styles.listingTop}>
          <h1 className="t-h2">{hero.title}</h1>
          {result ? (
            <p className={styles.resultCount} aria-live="polite">
              {result.total} {result.total === 1 ? "property" : "properties"}
            </p>
          ) : null}
        </div>
        {result ? (
          <div className={styles.listingLayout}>
            <FilterPanel query={query} facets={result.facets} />
            <div>
              {result.items.length > 0 ? (
                <>
                  <PropertyGrid items={result.items} whatsappBase={settings.whatsapp.href} />
                  <Pagination
                    query={query}
                    page={result.page}
                    pageSize={result.pageSize}
                    total={result.total}
                    totalPages={result.totalPages}
                  />
                </>
              ) : (
                <EmptyListing />
              )}
            </div>
          </div>
        ) : (
          <ListingError />
        )}
      </Container>
    </Section>
  );
}
