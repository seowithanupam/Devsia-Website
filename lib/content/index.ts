import { isDatabaseConfigured } from "@/lib/env";
import { createCmsContentProvider } from "./cms-provider";
import { createLocalContentProvider } from "./local-provider";
import type { ContentProvider } from "./types";

const local = createLocalContentProvider();
const cms = createCmsContentProvider();

/**
 * Content registry. With MONGODB_URI set, insights, legal text and upcoming projects come from the CMS
 * (MongoDB); without it, the built-in content that shipped in Phase 2 is used and nothing else changes.
 */
export function getContentProvider(): ContentProvider {
  return isDatabaseConfigured() ? cms : local;
}
