import Image from "next/image";
import Link from "next/link";
import { ArticleCard } from "@/components/insights/ArticleCard";
import { Badge, Button, ButtonLink, Container, Section, SectionHeading, StatusPanel, TextField } from "@/components/ui";
import { getContentProvider } from "@/lib/content";
import { ARTICLES_PAGE_SIZE } from "@/lib/content/article-queries";
import { insightsPage } from "@/lib/content/pages";
import { formatArticleDate } from "@/lib/format";
import { blockData, type InsightsHeroData } from "@/lib/cms/blocks";
import { getPageBlocks, getPageSeo } from "@/lib/cms/public";
import { buildMetadata } from "@/lib/seo/metadata";
import styles from "@/components/insights/insights.module.css";

export async function generateMetadata() {
  const hero = blockData<InsightsHeroData>(await getPageBlocks("insights"), "insights-hero");
  return buildMetadata({ title: "Insights", description: hero?.intro ?? insightsPage.intro, path: "/insights", seo: await getPageSeo("insights") });
}

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function insightsUrl(params: { q?: string; tag?: string; page?: number }): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.tag) search.set("tag", params.tag);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const qs = search.toString();
  return qs ? `/insights?${qs}` : "/insights";
}

/**
 * Insights listing: search (?q=), category chips with counts (?tag=), a featured article, a grid and
 * a "Latest" list, as in the video. The chip counts and the featured article are data-driven.
 */
export default async function InsightsPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const q = first(raw.q).trim().slice(0, 100);
  const tag = first(raw.tag).trim().slice(0, 60);
  const pageNumber = Number(first(raw.page));
  const page = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;

  const content = getContentProvider();
  const hero = blockData<InsightsHeroData>(await getPageBlocks("insights"), "insights-hero") ?? insightsPage;
  const [categories, result, featured, latest] = await Promise.all([
    content.getCategories(),
    content.getArticles({ search: q || undefined, categorySlug: tag || undefined, page, pageSize: ARTICLES_PAGE_SIZE }),
    content.getFeaturedArticle(),
    content.getLatestArticles(5),
  ]);
  const totalAll = categories.reduce((sum, c) => sum + c.count, 0);
  const filtering = q !== "" || tag !== "";

  return (
    <Section spacing="snug">
      <Container>
        <SectionHeading as="h1" label={hero.label} title={hero.title} description={hero.intro} />

        <div className={styles.searchRow}>
          <ul className={styles.chips} aria-label="Categories">
            <li>
              <Link href={insightsUrl({ q })} className={`${styles.chip} ${tag === "" ? styles.chipActive : ""}`} aria-current={tag === "" ? "page" : undefined}>
                All <span className={styles.chipCount}>{totalAll}</span>
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={insightsUrl({ q, tag: category.slug })}
                  className={`${styles.chip} ${tag === category.slug ? styles.chipActive : ""}`}
                  aria-current={tag === category.slug ? "page" : undefined}
                >
                  {category.label} <span className={styles.chipCount}>{category.count}</span>
                </Link>
              </li>
            ))}
          </ul>
          <form className={styles.searchForm} action="/insights" role="search">
            {tag ? <input type="hidden" name="tag" value={tag} /> : null}
            <TextField label="Search articles" name="q" type="search" defaultValue={q} placeholder="Search insights" />
            <Button type="submit" variant="outline" size="sm">
              Search
            </Button>
          </form>
        </div>

        {!filtering && featured ? (
          <article className={styles.featured}>
            <div className={styles.featuredMedia}>
              <Image
                src={featured.cover.src}
                alt={featured.cover.alt}
                fill
                sizes="(max-width: 809px) 100vw, 50vw"
                className={styles.cardImage}
                unoptimized={featured.cover.src.endsWith(".svg")}
                priority
              />
            </div>
            <div className={styles.featuredBody}>
              <div className={styles.cardMeta}>
                <Badge tone="tint">{featured.category}</Badge>
                <span>Featured · {featured.readMinutes} min read</span>
              </div>
              <h2 className="t-feature-lg">
                <Link href={`/insights/${featured.slug}`}>{featured.title}</Link>
              </h2>
              <p className="t-body">{featured.excerpt}</p>
              <div className={styles.cardFoot}>
                <time dateTime={featured.publishedAt}>{formatArticleDate(featured.publishedAt)}</time>
                <span>{featured.author.name}</span>
              </div>
            </div>
          </article>
        ) : null}

        {result.items.length > 0 ? (
          <>
            <ul className={styles.grid}>
              {result.items.map((article) => (
                <li key={article.slug}>
                  <ArticleCard article={article} />
                </li>
              ))}
            </ul>
            <p className={styles.searchRow} style={{ marginBottom: 0 }}>
              Showing {(result.page - 1) * result.pageSize + 1}–{Math.min(result.total, result.page * result.pageSize)} of {result.total}{" "}
              {result.total === 1 ? "article" : "articles"}
            </p>
            {result.totalPages > 1 ? (
              <div className={styles.chips}>
                {result.page > 1 ? (
                  <Link className={styles.chip} href={insightsUrl({ q, tag, page: result.page - 1 })}>
                    Previous
                  </Link>
                ) : null}
                {result.page < result.totalPages ? (
                  <Link className={styles.chip} href={insightsUrl({ q, tag, page: result.page + 1 })}>
                    Next
                  </Link>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <StatusPanel
            tone="empty"
            title="No articles found"
            actions={
              <ButtonLink href="/insights" variant="outline" size="sm">
                Clear search
              </ButtonLink>
            }
          >
            Try a different search word or category.
          </StatusPanel>
        )}

        {!filtering && latest.length > 0 ? (
          <div className={styles.latest}>
            <h2 className="t-h2">Latest</h2>
            <ul className={styles.latestList}>
              {latest.map((article) => (
                <li key={article.slug} className={styles.latestItem}>
                  <Link href={`/insights/${article.slug}`}>{article.title}</Link>
                  <span>{formatArticleDate(article.publishedAt)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Container>
    </Section>
  );
}
