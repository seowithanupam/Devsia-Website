/**
 * Central, typed access to environment variables.
 *
 * Phase 1 needs NO environment variables. This file records every variable named in
 * the recovered documentation, the phase that first needs it, and whether it is
 * required at that point. Nothing is read at import time, so a missing variable
 * only fails when the code that needs it actually runs.
 *
 * CRM variables are prepared for later integration. They are not required for the
 * mock-data version and no CRM value (base URL, key, agency ID) is guessed here.
 */

export type EnvSpec = {
  /** First implementation phase that needs this variable. */
  phase: number;
  /** Must be set once that phase is running. */
  required: boolean;
  note: string;
};

export const ENV_REGISTRY = {
  NEXT_PUBLIC_SITE_URL: {
    phase: 1,
    required: false,
    note: "Absolute site URL for canonical and Open Graph URLs. Falls back to VERCEL_URL, then localhost.",
  },
  MONGODB_URI: {
    phase: 3,
    required: true,
    note: "MongoDB Atlas connection string for site content, blog posts, navigation, settings, SEO, legal text, staff accounts, the leads mirror and the audit log. Without it the public site shows its built-in content and the admin panel is unavailable.",
  },
  AUTH_SECRET: {
    phase: 3,
    required: true,
    note: "Auth.js secret for admin sessions. Generate a fresh value for every environment (npx auth secret).",
  },
  SEED_ADMIN_NAME: {
    phase: 3,
    required: true,
    note: "First admin account name. Read only when the users collection is empty; the password must be changed after first sign-in.",
  },
  SEED_ADMIN_EMAIL: {
    phase: 3,
    required: true,
    note: "First admin account email.",
  },
  SEED_ADMIN_PASSWORD: {
    phase: 3,
    required: true,
    note: "First admin account password. Never commit a real value.",
  },
  BLOB_READ_WRITE_TOKEN: {
    phase: 3,
    required: true,
    note: "Vercel Blob token for the media library. Without it uploads are switched off and nothing is uploaded.",
  },
  REDIS_URL: {
    phase: 4,
    required: false,
    note: "Optional cache and rate-limit store. Decision D2 (required or optional) is still open.",
  },
  DEVSIA_API_BASE_URL: {
    phase: 0,
    required: false,
    note: "UNKNOWN: PropDesk base URL. Not required until CRM integration. Must come from the CRM developer.",
  },
  DEVSIA_API_KEY: {
    phase: 0,
    required: false,
    note: "PropDesk enterprise API key (Bearer). Not required until CRM integration. Server-only.",
  },
  DEVSIA_AGENCY_ID: {
    phase: 0,
    required: false,
    note: "PropDesk agency ID. Documented in the vendor PDF; not required until CRM integration.",
  },
} as const satisfies Record<string, EnvSpec>;

export type EnvName = keyof typeof ENV_REGISTRY;
export type ServerEnvName = Exclude<EnvName, "NEXT_PUBLIC_SITE_URL">;

const DEFAULT_LOCAL_SITE_URL = "http://localhost:3000";

/** Returns the trimmed value, or undefined when unset or blank. Server-side only. */
export function optionalEnv(name: ServerEnvName): string | undefined {
  const value = process.env[name];
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/** Returns the value or throws an error that says what needs it. Server-side only. */
export function requireEnv(name: ServerEnvName, neededBy: string): string {
  const value = optionalEnv(name);
  if (value === undefined) {
    throw new Error(
      `Missing environment variable ${name} (needed by ${neededBy}). ` +
        `Copy .env.example to .env.local and set it. ${ENV_REGISTRY[name].note}`,
    );
  }
  return value;
}

/**
 * The site's absolute URL, used for metadataBase, canonical URLs and Open Graph.
 *
 * Order: NEXT_PUBLIC_SITE_URL, then https://$VERCEL_URL (set by Vercel on preview and
 * production deployments), then http://localhost:3000. It deliberately does NOT
 * default to devsia.in: the domain is not connected to this project yet.
 *
 * NEXT_PUBLIC_ variables must be referenced literally so Next.js can inline them.
 */
export function getSiteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelHost = process.env.VERCEL_URL?.trim();
  const raw = explicit || (vercelHost ? `https://${vercelHost}` : DEFAULT_LOCAL_SITE_URL);
  try {
    return new URL(raw);
  } catch {
    throw new Error(`Site URL is not a valid absolute URL: "${raw}". Check NEXT_PUBLIC_SITE_URL.`);
  }
}

/** True when a MongoDB connection string is set. The public site uses its built-in content when it is not. Server-side only. */
export function isDatabaseConfigured(): boolean {
  return optionalEnv("MONGODB_URI") !== undefined;
}

/** True when the Vercel Blob token is set, so media uploads can work. Server-side only. */
export function isBlobConfigured(): boolean {
  return optionalEnv("BLOB_READ_WRITE_TOKEN") !== undefined;
}

/** True when the Auth.js secret is set, so admin sign-in can work. Server-side only. */
export function isAuthConfigured(): boolean {
  return optionalEnv("AUTH_SECRET") !== undefined;
}
