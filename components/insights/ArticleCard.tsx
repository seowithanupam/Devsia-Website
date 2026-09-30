import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Article } from "@/lib/content/types";
import { formatArticleDate } from "@/lib/format";
import styles from "./insights.module.css";

/**
 * Article card. tone "navy" is the dark "Latest" card that leads the Home insights row in the video.
 */
export function ArticleCard({ article, tone = "light" }: { article: Article; tone?: "light" | "navy" }) {
  const href = `/insights/${article.slug}`;
  return (
    <article className={cn(styles.card, tone === "navy" && styles.cardNavy)}>
      {tone === "light" ? (
        <Link href={href} tabIndex={-1} aria-hidden="true" className={styles.cardMedia}>
          <Image src={article.cover.src} alt="" fill sizes="(max-width: 809px) 100vw, 33vw" className={styles.cardImage} unoptimized={article.cover.src.endsWith(".svg")} />
        </Link>
      ) : null}
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          {tone === "navy" ? <Badge tone="gold">Latest</Badge> : <Badge tone="tint">{article.category}</Badge>}
          <span>{article.readMinutes} min read</span>
        </div>
        <h3 className={cn("t-title", styles.cardTitle)}>
          <Link href={href}>{article.title}</Link>
        </h3>
        <p className={styles.cardExcerpt}>{article.excerpt}</p>
        <div className={styles.cardFoot}>
          <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time>
          <span>{article.author.name}</span>
        </div>
      </div>
    </article>
  );
}
