import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * The recovered handover documentation (section 08) says these four headers are
 * set site-wide and that X-Powered-By is removed. It does NOT record their values.
 * The values below are TEMPORARY / PROPOSED and should be reviewed before launch.
 * Content-Security-Policy and HSTS are not mentioned in any source and are not set.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Server Actions accept only 1 MB by default. The media upload limit is 4 MB (lib/cms/media.ts) and Vercel itself
    // stops request bodies at 4.5 MB, so this is set to match that platform limit. Uploads stay off without BLOB_READ_WRITE_TOKEN.
    serverActions: { bodySizeLimit: "4.5mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    // Media uploaded through the admin panel lives on the Vercel Blob public store. Only that host is allowed.
    // UNKNOWN: the PropDesk image host is not documented, so it is not added here yet.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
