"use client";

import { createContext, useContext, type ReactNode } from "react";
import { siteSettings, type SiteSettings } from "@/lib/content/site";

/**
 * Site settings for client components (forms, wishlist). The public layout reads them from the CMS on the
 * server and passes them here. Without a provider (for example in tests) the built-in settings are used.
 */
const SiteSettingsContext = createContext<SiteSettings>(siteSettings);

export function SiteSettingsProvider({ value, children }: { value: SiteSettings; children: ReactNode }) {
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext);
}
