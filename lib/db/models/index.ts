import "server-only";
import { Schema, model, models, type Model, type Types } from "mongoose";
import { ROLES } from "@/lib/auth/capabilities";

/**
 * MongoDB collections (the proposals in the Rebuild Specification, section 3, built as stored documents).
 * Property data is NOT stored here: listings always come from the property provider (the CRM later).
 */

const seoSchema = new Schema(
  {
    title: String,
    description: String,
    canonical: String,
    ogTitle: String,
    ogDescription: String,
    ogImage: String,
    noIndex: Boolean,
    noFollow: Boolean,
  },
  { _id: false },
);

export type SeoDoc = {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
  noFollow?: boolean;
};

function make<T>(name: string, schema: Schema<T>): Model<T> {
  return (models[name] as Model<T> | undefined) ?? model<T>(name, schema);
}

/* users -------------------------------------------------------------------------------------------- */
export interface UserDoc {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: (typeof ROLES)[number];
  active: boolean;
  mustChangePassword: boolean;
  failedAttempts: number;
  lockedUntil: Date | null;
  /** Goes up on every password change or reset; sessions issued before that stop working (see lib/auth/session-version.ts). */
  sessionVersion: number;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
    active: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: true },
    failedAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    sessionVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);
export const UserModel = make<UserDoc>("User", userSchema);

/* pages -------------------------------------------------------------------------------------------- */
export interface PageDoc {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  blocks: Array<{ type: string; order: number; enabled: boolean; data: Record<string, unknown> }>;
  seo: SeoDoc;
  updatedBy?: string;
  updatedAt: Date;
}
const pageSchema = new Schema<PageDoc>(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    blocks: [{ _id: false, type: { type: String, required: true }, order: Number, enabled: { type: Boolean, default: true }, data: Schema.Types.Mixed }],
    seo: { type: seoSchema, default: () => ({}) },
    updatedBy: String,
  },
  { timestamps: true },
);
export const PageModel = make<PageDoc>("Page", pageSchema);

/* posts -------------------------------------------------------------------------------------------- */
export interface PostDoc {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  categorySlug: string;
  tags: string[];
  authorName: string;
  authorRole: string;
  coverUrl: string;
  coverAlt: string;
  coverCaption: string;
  readMinutes: number | null;
  featured: boolean;
  placeholderBody: boolean;
  status: "draft" | "published";
  publishedAt: Date | null;
  seo: SeoDoc;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
const postSchema = new Schema<PostDoc>(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    excerpt: { type: String, default: "" },
    body: { type: String, default: "" },
    category: { type: String, default: "" },
    categorySlug: { type: String, default: "" },
    tags: { type: [String], default: [] },
    authorName: { type: String, default: "" },
    authorRole: { type: String, default: "" },
    coverUrl: { type: String, default: "" },
    coverAlt: { type: String, default: "" },
    coverCaption: { type: String, default: "" },
    readMinutes: { type: Number, default: null },
    featured: { type: Boolean, default: false },
    placeholderBody: { type: Boolean, default: false },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: { type: Date, default: null },
    seo: { type: seoSchema, default: () => ({}) },
    createdBy: String,
    updatedBy: String,
  },
  { timestamps: true },
);
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ tags: 1 });
export const PostModel = make<PostDoc>("Post", postSchema);

/* navigation and settings: one document each -------------------------------------------------------- */
export interface NavigationDoc {
  _id: Types.ObjectId;
  key: string;
  header: Array<{ label: string; href: string }>;
  headerButtons?: { associateLabel: string; enquiryLabel: string };
  footerCompany: { title: string; links: Array<{ label: string; href: string }> };
  legal: Array<{ label: string; href: string }>;
  updatedBy?: string;
}
const link = { _id: false, label: String, href: String };
const navigationSchema = new Schema<NavigationDoc>(
  {
    key: { type: String, required: true, unique: true, default: "main" },
    header: [link],
    headerButtons: { associateLabel: String, enquiryLabel: String },
    footerCompany: { title: String, links: [link] },
    legal: [link],
    updatedBy: String,
  },
  { timestamps: true },
);
export const NavigationModel = make<NavigationDoc>("Navigation", navigationSchema);

export interface SettingsDoc {
  _id: Types.ObjectId;
  key: string;
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
  updatedBy?: string;
}
const settingsSchema = new Schema<SettingsDoc>(
  {
    key: { type: String, required: true, unique: true, default: "main" },
    agencyName: String,
    blurb: String,
    phoneDisplay: String,
    whatsappDisplay: String,
    email: String,
    privacyEmail: String,
    addressLine1: String,
    addressLine2: String,
    reraNumber: String,
    hoursWeekdays: String,
    hoursSunday: String,
    partnerPhone: String,
    partnerEmail: String,
    footerDisclaimer: String,
    updatedBy: String,
  },
  { timestamps: true },
);
export const SettingsModel = make<SettingsDoc>("Settings", settingsSchema);

/* SEO ---------------------------------------------------------------------------------------------- */
export interface SeoTemplateDoc {
  _id: Types.ObjectId;
  type: string;
  titleTemplate: string;
  descriptionTemplate: string;
  ogImage: string;
  updatedBy?: string;
}
const seoTemplateSchema = new Schema<SeoTemplateDoc>(
  { type: { type: String, required: true, unique: true }, titleTemplate: String, descriptionTemplate: String, ogImage: { type: String, default: "" }, updatedBy: String },
  { timestamps: true },
);
export const SeoTemplateModel = make<SeoTemplateDoc>("SeoTemplate", seoTemplateSchema);

export interface PropertySeoOverrideDoc {
  _id: Types.ObjectId;
  slug: string;
  seo: SeoDoc;
  updatedBy?: string;
  updatedAt: Date;
}
const propertySeoSchema = new Schema<PropertySeoOverrideDoc>(
  { slug: { type: String, required: true, unique: true }, seo: { type: seoSchema, default: () => ({}) }, updatedBy: String },
  { timestamps: true },
);
export const PropertySeoOverrideModel = make<PropertySeoOverrideDoc>("PropertySeoOverride", propertySeoSchema);

/* legal -------------------------------------------------------------------------------------------- */
export interface LegalDoc {
  _id: Types.ObjectId;
  slug: string;
  navLabel: string;
  title: string;
  lastUpdated: string;
  intro: string;
  body: string;
  updatedBy?: string;
}
const legalSchema = new Schema<LegalDoc>(
  { slug: { type: String, required: true, unique: true }, navLabel: String, title: String, lastUpdated: String, intro: String, body: String, updatedBy: String },
  { timestamps: true },
);
export const LegalModel = make<LegalDoc>("LegalDocument", legalSchema);

/* media -------------------------------------------------------------------------------------------- */
export interface MediaDoc {
  _id: Types.ObjectId;
  url: string;
  pathname: string;
  filename: string;
  contentType: string;
  size: number;
  alt: string;
  uploadedBy: string;
  createdAt: Date;
}
const mediaSchema = new Schema<MediaDoc>(
  { url: { type: String, required: true }, pathname: { type: String, required: true }, filename: String, contentType: String, size: Number, alt: { type: String, default: "" }, uploadedBy: String },
  { timestamps: true },
);
mediaSchema.index({ createdAt: -1 });
export const MediaModel = make<MediaDoc>("Media", mediaSchema);

/* leads mirror --------------------------------------------------------------------------------------- */
export interface LeadDoc {
  _id: Types.ObjectId;
  kind: "enquiry" | "associate" | "contact";
  name: string;
  phone: string;
  payload: Record<string, unknown>;
  pageEnquired: string;
  source: string;
  crmStatus: "not_integrated" | "sent";
  receivedAt: Date;
}
const leadSchema = new Schema<LeadDoc>(
  {
    kind: { type: String, enum: ["enquiry", "associate", "contact"], required: true },
    name: String,
    phone: String,
    payload: Schema.Types.Mixed,
    pageEnquired: { type: String, default: "" },
    source: { type: String, default: "Website" },
    crmStatus: { type: String, enum: ["not_integrated", "sent"], default: "not_integrated" },
    receivedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false },
);
leadSchema.index({ receivedAt: -1 });
export const LeadModel = make<LeadDoc>("Lead", leadSchema);

/* audit log ------------------------------------------------------------------------------------------ */
export interface AuditDoc {
  _id: Types.ObjectId;
  actorId: string | null;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  meta: Record<string, unknown>;
  at: Date;
}
const auditSchema = new Schema<AuditDoc>(
  {
    actorId: { type: String, default: null },
    actorEmail: { type: String, default: "" },
    actorRole: { type: String, default: "" },
    action: { type: String, required: true },
    entityType: { type: String, default: "" },
    entityId: { type: String, default: "" },
    summary: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed, default: {} },
    at: { type: Date, default: () => new Date() },
  },
  { timestamps: false },
);
auditSchema.index({ at: -1 });
auditSchema.index({ action: 1, at: -1 });
export const AuditModel = make<AuditDoc>("AuditLog", auditSchema);

/* meta: one-off markers (for example "default content has been loaded") ---------------------------------- */
export interface MetaDoc {
  _id: Types.ObjectId;
  key: string;
  value: string;
}
const metaSchema = new Schema<MetaDoc>({ key: { type: String, required: true, unique: true }, value: { type: String, default: "" } }, { timestamps: true });
export const MetaModel = make<MetaDoc>("Meta", metaSchema);

/* per-network sign-in failure counters: keyed hash of the address, expire on their own ---------------------- */
export interface LoginAttemptDoc {
  _id: Types.ObjectId;
  key: string;
  count: number;
  windowStart: Date;
  expiresAt: Date;
}
const loginAttemptSchema = new Schema<LoginAttemptDoc>({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  windowStart: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
});
loginAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const LoginAttemptModel = make<LoginAttemptDoc>("LoginAttempt", loginAttemptSchema);

/** Every model by name, so code that works from a name (the index check) never guesses a collection name. */
export const MODELS_BY_NAME = {
  User: UserModel,
  Page: PageModel,
  Post: PostModel,
  Navigation: NavigationModel,
  Settings: SettingsModel,
  SeoTemplate: SeoTemplateModel,
  PropertySeoOverride: PropertySeoOverrideModel,
  LegalDocument: LegalModel,
  Media: MediaModel,
  Lead: LeadModel,
  AuditLog: AuditModel,
  Meta: MetaModel,
  LoginAttempt: LoginAttemptModel,
} as const;
