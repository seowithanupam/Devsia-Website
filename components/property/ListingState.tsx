import { ButtonLink, Skeleton, StatusPanel } from "@/components/ui";
import styles from "./property.module.css";

/** Skeleton cards shown while the listing loads (the video shows grey loading cards). */
export function ListingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className={styles.grid} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className={styles.card}>
          <Skeleton height={200} radius={0} />
          <div className={styles.cardBody}>
            <Skeleton width="30%" height={12} />
            <Skeleton width="80%" height={20} />
            <Skeleton width="40%" height={24} />
            <Skeleton height={44} />
            <Skeleton height={52} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function EmptyListing() {
  return (
    <StatusPanel
      tone="empty"
      title="No properties match these filters"
      actions={
        <ButtonLink href="/properties" variant="outline" size="sm">
          Reset filters
        </ButtonLink>
      }
    >
      Try a wider budget or fewer locations, or post an enquiry and an advisor will send options that fit.
    </StatusPanel>
  );
}

export function ListingError({ onRetry }: { onRetry?: () => void }) {
  return (
    <StatusPanel
      tone="error"
      title="We could not load the properties"
      actions={
        <>
          {onRetry ? (
            <button type="button" className={styles.reset} onClick={onRetry}>
              Try again
            </button>
          ) : null}
          <ButtonLink href="/enquire" size="sm">
            Post your enquiry
          </ButtonLink>
        </>
      }
    >
      Something went wrong on our side. Please try again in a moment.
    </StatusPanel>
  );
}
