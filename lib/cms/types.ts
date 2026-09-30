import type { BlockData, BlockType } from "./blocks";
import type { Role } from "@/lib/auth/capabilities";

/** Plain-object shapes of the stored documents (what repositories return). No Mongoose types leak past the repositories. */

export type SeoFields = {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
  noFollow?: boolean;
};

export type PageRecord = {
  slug: string;
  title: string;
  blocks: Array<{ type: BlockType; order: number; enabled: boolean; data: BlockData }>;
  seo: SeoFields;
  updatedBy?: string;
  updatedAt?: string;
};

export type PostStatus = "draft" | "published";

export type PostRecord = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  /** Text in the syntax of lib/cms/body-syntax.ts. */
  body: string;
  category: string;
  categorySlug: string;
  tags: string[];
  authorName: string;
  authorRole: string;
  coverUrl: string;
  coverAlt: string;
  coverCaption: string;
  /** null means "work it out from the body". */
  readMinutes: number | null;
  featured: boolean;
  placeholderBody: boolean;
  status: PostStatus;
  /** ISO string, or null while never published. */
  publishedAt: string | null;
  seo: SeoFields;
  createdAt?: string;
  updatedAt?: string;
};

export type NavLinkRecord = { label: string; href: string };

export type NavigationRecord = {
  header: NavLinkRecord[];
  /** The text of the two header buttons (they always go to /associates and /enquire). */
  headerButtons: { associateLabel: string; enquiryLabel: string };
  footerCompany: { title: string; links: NavLinkRecord[] };
  legal: NavLinkRecord[];
};

export type SettingsRecord = {
  agencyName: string;
  blurb: string;
  phoneDisplay: string;
  whatsappDisplay: string;
  email: string;
  privacyEmail: string;
  addressLine1: string;
  addressLine2: string;
  reraNumber: string;
  hoursWeekdays: string;
  hoursSunday: string;
  partnerPhone: string;
  partnerEmail: string;
  footerDisclaimer: string;
};

export type LegalRecord = {
  slug: "privacy" | "terms";
  navLabel: string;
  title: string;
  lastUpdated: string;
  intro: string;
  /** Text in the legal syntax of lib/cms/body-syntax.ts. */
  body: string;
};

export type SeoTemplateRecord = { titleTemplate: string; descriptionTemplate: string; ogImage: string };

export type PropertySeoOverrideRecord = { slug: string; seo: SeoFields; updatedBy?: string; updatedAt?: string };

export type MediaRecord = {
  id: string;
  url: string;
  pathname: string;
  filename: string;
  contentType: string;
  size: number;
  alt: string;
  uploadedBy: string;
  createdAt: string;
};

export type LeadKind = "enquiry" | "associate" | "contact";

export type LeadRecord = {
  id: string;
  kind: LeadKind;
  name: string;
  phone: string;
  /** The validated form input. NOT a PropDesk request body: the CRM mapping is not integrated yet. */
  payload: Record<string, unknown>;
  pageEnquired: string;
  source: string;
  /** "not_integrated" while the mock provider is in use. Later: the outcome reported by the CRM once it is connected. */
  crmStatus: "not_integrated" | "sent";
  receivedAt: string;
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  mustChangePassword: boolean;
  /** Goes up whenever the password changes; older sessions stop working. */
  sessionVersion: number;
  lastLoginAt: string | null;
  createdAt: string;
};

export type AuditRecord = {
  id: string;
  actorId: string | null;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  meta: Record<string, unknown>;
  at: string;
};
