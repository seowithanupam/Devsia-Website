"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, SearchIcon, SelectField, TextField } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatIndianNumber } from "@/lib/format";
import { buildPropertiesUrl, parseRupees } from "@/lib/services/property-filters";
import type { FacetOption } from "@/lib/services/types";
import styles from "./home.module.css";

export type HeroTab = {
  /** "" for All, otherwise a type slug such as "plot". */
  value: string;
  label: string;
  count: number;
  /** Locations available for this tab, with counts. */
  locations: FacetOption[];
  priceRange: { min: number; max: number } | null;
};

/**
 * Hero search: tabs (All / Plot / Farmhouse, with counts), Location select, Min and Max budget,
 * and Search. The tabs and counts come from the live listing facets, as in the video. Search opens
 * /properties with the same URL parameters the video showed (type, location, minPrice, maxPrice).
 */
export function HeroSearch({ tabs }: { tabs: HeroTab[] }) {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(tabs[0]?.value ?? "");
  const [location, setLocation] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const tab = tabs.find((t) => t.value === tabValue) ?? tabs[0];

  function selectTab(value: string) {
    setTabValue(value);
    setLocation("");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(
      buildPropertiesUrl({
        types: tabValue ? [tabValue] : [],
        locations: location ? [location] : [],
        minPrice: parseRupees(min),
        maxPrice: parseRupees(max),
      }),
    );
  }

  if (!tab) return null;

  return (
    <div className={styles.search}>
      <div role="tablist" aria-label="Property type" className={styles.searchTabs}>
        {tabs.map((t) => (
          <button
            key={t.value || "all"}
            type="button"
            role="tab"
            aria-selected={t.value === tabValue}
            className={cn(styles.searchTab, t.value === tabValue && styles.searchTabActive)}
            onClick={() => selectTab(t.value)}
          >
            {t.label} <span className={styles.searchTabCount}>({t.count})</span>
          </button>
        ))}
      </div>
      <form className={styles.searchForm} onSubmit={onSubmit} noValidate>
        <SelectField label="Location" name="location" value={location} onChange={(e) => setLocation(e.target.value)}>
          <option value="">All locations</option>
          {tab.locations.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} ({option.count})
            </option>
          ))}
        </SelectField>
        <TextField
          label="Min budget (₹)"
          name="minPrice"
          inputMode="numeric"
          placeholder={tab.priceRange ? formatIndianNumber(tab.priceRange.min) : "Min"}
          value={min}
          onChange={(e) => setMin(e.target.value)}
        />
        <TextField
          label="Max budget (₹)"
          name="maxPrice"
          inputMode="numeric"
          placeholder={tab.priceRange ? formatIndianNumber(tab.priceRange.max) : "Max"}
          value={max}
          onChange={(e) => setMax(e.target.value)}
        />
        <Button type="submit" variant="red" className={styles.searchButton}>
          <SearchIcon size={16} /> Search
        </Button>
      </form>
    </div>
  );
}
