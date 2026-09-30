"use client";

import { Container, Section } from "@/components/ui";
import { ListingError } from "@/components/property/ListingState";

export default function PropertiesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Section spacing="snug">
      <Container>
        <ListingError onRetry={reset} />
      </Container>
    </Section>
  );
}
