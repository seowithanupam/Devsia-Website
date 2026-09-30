import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSiteUrl } from "@/lib/env";
import "@/styles/fonts.css";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/typography.css";
import "@/styles/utilities.css";

/*
 * TEMPORARY metadata. The real per-page titles, descriptions, canonical URLs and
 * Open Graph data come from the CMS and the SEO phase. The description reuses the
 * footer blurb from the original design.
 */
export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: { default: "DevSia", template: "%s · DevSia" },
  description: "DevSia Realty LLP: residential and plotted advisory across Jaipur.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Preload the main font subset to avoid a flash of fallback text. */}
        <link
          rel="preload"
          href="/fonts/plus-jakarta-sans-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
