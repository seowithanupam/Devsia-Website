import Link from "next/link";
import { buildPropertiesUrl, paginationItems } from "@/lib/services/property-filters";
import type { PropertyQuery } from "@/lib/services/types";
import styles from "./property.module.css";

/** "Showing 1–8 of 8" and page links. Page links keep the current filters. */
export function Pagination({
  query,
  page,
  pageSize,
  total,
  totalPages,
}: {
  query: Pick<PropertyQuery, "locations" | "types" | "minPrice" | "maxPrice">;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const href = (p: number) => buildPropertiesUrl({ ...query, page: p });
  return (
    <div className={styles.pagination}>
      <p className={styles.showing}>
        Showing {from}–{to} of {total}
      </p>
      {totalPages > 1 ? (
        <nav aria-label="Pagination">
          <ul className={styles.pages}>
            {page > 1 ? (
              <li>
                <Link href={href(page - 1)} className={styles.pageLink} rel="prev">
                  Previous
                </Link>
              </li>
            ) : null}
            {paginationItems(page, totalPages).map((item, index) =>
              item === "…" ? (
                <li key={`gap-${index}`} className={styles.pageGap} aria-hidden="true">
                  …
                </li>
              ) : (
                <li key={item}>
                  <Link
                    href={href(item)}
                    className={`${styles.pageLink} ${item === page ? styles.pageCurrent : ""}`}
                    aria-current={item === page ? "page" : undefined}
                  >
                    {item}
                  </Link>
                </li>
              ),
            )}
            {page < totalPages ? (
              <li>
                <Link href={href(page + 1)} className={styles.pageLink} rel="next">
                  Next
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
