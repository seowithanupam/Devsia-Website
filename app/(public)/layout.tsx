import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteSettingsProvider } from "@/components/providers/SiteSettingsProvider";
import { getSiteSettings } from "@/lib/cms/public";
import { StoreProvider } from "@/store/StoreProvider";

// Content (settings, navigation, pages, posts) is edited in the admin panel and must show up without a redeploy.
export const dynamic = "force-dynamic";

/** Shell for every public page: skip link, header, main content and footer. */
export default async function PublicLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <StoreProvider>
      <SiteSettingsProvider value={settings}>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </SiteSettingsProvider>
    </StoreProvider>
  );
}
