"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { Button, TextField } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatIndianNumber } from "@/lib/format";
import { buildPropertiesUrl, parseRupees } from "@/lib/services/property-filters";
import type { PropertyFacets, PropertyQuery } from "@/lib/services/types";
import styles from "./property.module.css";

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/**
 * Filter panel for /properties: Budget (min / max), Location checkboxes with counts, Property type,
 * Reset. It is driven by the URL: every change navigates to the new /properties?... address, so
 * results can be shared and the back button works. Counts come from the server (facets).
 * The video does not show whether checkboxes apply immediately or only after a button press;
 * checkboxes apply immediately and the budget applies on "Apply" (ASSUMED).
 */
export function FilterPanel({
  query,
  facets,
  idPrefix = "filters",
}: {
  query: Pick<PropertyQuery, "locations" | "types" | "minPrice" | "maxPrice">;
  facets: PropertyFacets;
  idPrefix?: string;
}) {
  const router = useRouter();
  const bodyId = useId();
  // On phones the panel starts collapsed so results are not pushed far down the page. Desktop always shows it.
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(query.minPrice !== undefined ? String(query.minPrice) : "");
  const [max, setMax] = useState(query.maxPrice !== undefined ? String(query.maxPrice) : "");
  const [minKey, setMinKey] = useState(query.minPrice);
  const [maxKey, setMaxKey] = useState(query.maxPrice);

  // Keep the inputs in step with the URL after navigation (Reset, back button).
  if (minKey !== query.minPrice) {
    setMinKey(query.minPrice);
    setMin(query.minPrice !== undefined ? String(query.minPrice) : "");
  }
  if (maxKey !== query.maxPrice) {
    setMaxKey(query.maxPrice);
    setMax(query.maxPrice !== undefined ? String(query.maxPrice) : "");
  }

  const hasFilters =
    query.locations.length > 0 || query.types.length > 0 || query.minPrice !== undefined || query.maxPrice !== undefined;

  const activeCount =
    query.locations.length + query.types.length + (query.minPrice !== undefined ? 1 : 0) + (query.maxPrice !== undefined ? 1 : 0);

  function go(next: Partial<PropertyQuery>) {
    router.push(buildPropertiesUrl({ ...query, ...next, page: 1 }));
  }

  function applyBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    go({ minPrice: parseRupees(min), maxPrice: parseRupees(max) });
  }

  const range = facets.priceRange;

  return (
    <aside className={styles.filters} aria-label="Filters">
      <div className={styles.filtersHead}>
        <h2 className={styles.filtersTitle}>Filters</h2>
        <div className={styles.filtersHeadActions}>
          {hasFilters ? (
            <button type="button" className={styles.reset} onClick={() => router.push("/properties")}>
              Reset
            </button>
          ) : null}
          <button
            type="button"
            className={styles.filterToggle}
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? "Hide filters" : activeCount > 0 ? `Show filters (${activeCount})` : "Show filters"}
          </button>
        </div>
      </div>
      <div id={bodyId} className={cn(styles.filterBody, !open && styles.filterBodyClosed)}>

      <form className={styles.filterGroup} onSubmit={applyBudget} noValidate>
        <h3 className={styles.groupTitle}>Budget</h3>
        <div className={styles.budgetRow}>
          <TextField
            label="Min (₹)"
            name="minPrice"
            inputMode="numeric"
            placeholder={range ? formatIndianNumber(range.min) : "Min"}
            value={min}
            onChange={(e) => setMin(e.target.value)}
          />
          <TextField
            label="Max (₹)"
            name="maxPrice"
            inputMode="numeric"
            placeholder={range ? formatIndianNumber(range.max) : "Max"}
            value={max}
            onChange={(e) => setMax(e.target.value)}
          />
        </div>
        <Button type="submit" variant="outline" size="sm" fullWidth>
          Apply budget
        </Button>
      </form>

      <fieldset className={styles.filterGroup}>
        <legend className={styles.groupTitle}>Location</legend>
        {facets.locations.map((option) => {
          const id = `${idPrefix}-loc-${option.value}`;
          return (
            <label key={option.value} htmlFor={id} className={styles.filterOption}>
              <input
                id={id}
                type="checkbox"
                checked={query.locations.includes(option.value)}
                onChange={() => go({ locations: toggleValue(query.locations, option.value) })}
              />
              <span>{option.label}</span>
              <span className={styles.count}>{option.count}</span>
            </label>
          );
        })}
      </fieldset>

      <fieldset className={styles.filterGroup}>
        <legend className={styles.groupTitle}>Property type</legend>
        {facets.types.map((option) => {
          const id = `${idPrefix}-type-${option.value}`;
          return (
            <label key={option.value} htmlFor={id} className={styles.filterOption}>
              <input
                id={id}
                type="checkbox"
                checked={query.types.includes(option.value)}
                onChange={() => go({ types: toggleValue(query.types, option.value) })}
              />
              <span>{option.label}</span>
              <span className={styles.count}>{option.count}</span>
            </label>
          );
        })}
      </fieldset>
      </div>
    </aside>
  );
}
