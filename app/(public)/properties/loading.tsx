import { Container, Section, Skeleton } from "@/components/ui";
import { ListingSkeleton } from "@/components/property/ListingState";
import styles from "@/components/property/property.module.css";

/** Shown while the listing loads. The video showed grey skeleton cards. */
export default function Loading() {
  return (
    <Section spacing="snug" aria-busy="true">
      <Container>
        <Skeleton width="min(320px, 100%)" height={34} />
        <div className={styles.listingLayout} style={{ marginTop: 24 }}>
          <Skeleton height={420} radius="var(--radius-card)" />
          <ListingSkeleton />
        </div>
      </Container>
    </Section>
  );
}
