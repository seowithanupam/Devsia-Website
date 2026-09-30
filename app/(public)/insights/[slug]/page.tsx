import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/insights/ArticleCard";
import { ArticleBody } from "@/components/insights/ArticleBody";
import { ContactForm } from "@/components/forms/ContactForm";
import { Badge, Container, Section, SectionHeading } from "@/components/ui";
import { getContentProvider } from "@/lib/content";
import { blockData, type InsightsHeroData } from "@/lib/cms/blocks";
import { getPageBlocks } from "@/lib/cms/public";
import { PLACEHOLDER_BODY_NOTE } from "@/lib/content/articles";
import { insightsPage } from "@/lib/content/pages";
import { formatArticleDate, initials } from "@/lib/format";
import { buildMetadata } from "@/lib/seo/metadata";
import styles from "@/components/insights/insights.module.css";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getContentProvider().getArticle(slug);
  if (!article) return { title: "Article not found", robots: { index: false } };
  return buildMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/insights/${article.slug}`,
    image: article.cover.src,
    type: "article",
    seo: article.seo,
  });
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const content = getContentProvider();
  const article = await content.getArticle(slug);
  if (!article) notFound();
  const related = await content.getRelatedArticles(article.slug, 3);
  const insights = blockData<InsightsHeroData>(await getPageBlocks("insights"), "insights-hero") ?? insightsPage;
  const headings = article.body.flatMap((block) => (block.type === "h2" ? [{ id: block.id, text: block.text }] : []));

  return (
    <>
      <Section spacing="snug">
        <Container>
          <nav aria-label="Breadcrumb" className="t-small">
            <Link href="/">Home</Link> / <Link href="/insights">Insights</Link> / {article.category}
          </nav>
          <header className={styles.articleHead} style={{ marginTop: 20 }}>
            <div>
              <Badge tone="tint">{article.category}</Badge>
            </div>
            <h1 className="t-h2">{article.title}</h1>
            <div className={styles.articleMeta}>
              <span>{article.author.name}</span>
              <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time>
              <span>{article.readMinutes} min read</span>
            </div>
          </header>
          <figure className={styles.cover}>
            <Image src={article.cover.src} alt={article.cover.alt} fill priority sizes="100vw" className={styles.cardImage} unoptimized={article.cover.src.endsWith(".svg")} />
          </figure>

          <div className={styles.article}>
            <aside className={styles.toc} aria-label="On this page">
              {headings.length > 0 ? (
                <>
                  <h2 className={styles.tocTitle}>On this page</h2>
                  <ol>
                    {headings.map((heading) => (
                      <li key={heading.id}>
                        <a href={`#${heading.id}`}>{heading.text}</a>
                      </li>
                    ))}
                  </ol>
                </>
              ) : null}
            </aside>
            <article className={styles.prose}>
              {article.placeholderBody ? <p className={styles.notice}>{PLACEHOLDER_BODY_NOTE}</p> : null}
              <ArticleBody blocks={article.body} />
              {article.tags.length > 0 ? (
                <div className={styles.tagRow}>
                  {article.tags.map((tag) => (
                    <Badge key={tag} tone="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
              <div className={styles.authorCard}>
                <span className={styles.avatar} aria-hidden="true">
                  {initials(article.author.name)}
                </span>
                <strong>{article.author.name}</strong>
                {article.author.role ? <span className="t-small">{article.author.role}</span> : null}
              </div>
              <div className={styles.callbackCard}>
                <strong>Want to talk this through?</strong>
                <span className="t-small">Leave your number and an advisor will call you back.</span>
                <ContactForm
                  kind="callback"
                  submitLabel="Request a callback"
                  successTitle={insights.callbackSuccessTitle}
                  successText={insights.callbackSuccessText}
                  pageContext={`/insights/${article.slug}`}
                />
              </div>
            </article>
          </div>
        </Container>
      </Section>

      {related.length > 0 ? (
        <Section tone="tint" spacing="snug">
          <Container>
            <SectionHeading label="Related reading" title="Keep reading" />
            <ul className={styles.grid} style={{ marginTop: 28 }}>
              {related.map((item) => (
                <li key={item.slug}>
                  <ArticleCard article={item} />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}
    </>
  );
}
