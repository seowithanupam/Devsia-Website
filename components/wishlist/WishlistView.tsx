"use client";

import { useEffect, useState } from "react";
import { ButtonLink, StatusPanel } from "@/components/ui";
import { ListingError, ListingSkeleton } from "@/components/property/ListingState";
import { PropertyCard } from "@/components/property/PropertyCard";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import type { Property, PropertyListResult } from "@/lib/services/types";
import { useWishlist } from "@/store/hooks";
import styles from "@/components/pages/pages.module.css";

/** The outcome of one fetch, tagged with the request it answers. */
type Outcome = { request: string; items: Property[] | null };

/**
 * Wishlist page. Only slugs are stored in the browser (Redux + localStorage); the property details are
 * fetched from the site's own /api/v1/properties route, so prices stay current.
 *
 * What is on screen is worked out while rendering from three things: the saved slugs, whether they have been
 * read from storage yet, and the latest fetch outcome. "Loading" is simply "no outcome yet for the current
 * request", so nothing has to be set synchronously inside the effect; the effect only stores results once
 * a fetch has finished.
 */
export function WishlistView() {
  const { slugs, hydrated } = useWishlist();
  const settings = useSiteSettings();
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [attempt, setAttempt] = useState(0);

  const key = slugs.join(",");
  const request = `${key}#${attempt}`;

  useEffect(() => {
    if (!hydrated || key === "") return;
    const controller = new AbortController();
    fetch(`/api/v1/properties?slugs=${encodeURIComponent(key)}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("bad response");
        return response.json() as Promise<PropertyListResult>;
      })
      .then((data) => setOutcome({ request, items: data.items }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return; // superseded by a newer request
        setOutcome({ request, items: null });
      });
    return () => controller.abort();
  }, [hydrated, key, request]);

  if (!hydrated) return <ListingSkeleton count={1} />;

  // Nothing saved: there is nothing to fetch.
  if (key === "") return <EmptyWishlist />;

  // The current request has not finished yet.
  if (outcome === null || outcome.request !== request) return <ListingSkeleton count={Math.max(1, Math.min(slugs.length, 3))} />;

  if (outcome.items === null) return <ListingError onRetry={() => setAttempt((n) => n + 1)} />;
  if (outcome.items.length === 0) return <EmptyWishlist />;

  return (
    <ul className={styles.wishGrid}>
      {outcome.items.map((property) => (
        <li key={property.id}>
          <PropertyCard property={property} whatsappBase={settings.whatsapp.href} />
        </li>
      ))}
    </ul>
  );
}

function EmptyWishlist() {
  return (
    <div className={styles.centre}>
      <StatusPanel tone="empty" title="Your wishlist is empty" actions={<ButtonLink href="/properties">Browse properties</ButtonLink>}>
        Tap the heart on any listing to save it here. Saved listings stay on this device.
      </StatusPanel>
    </div>
  );
}
