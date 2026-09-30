// @vitest-environment node
/**
 * Real-MongoDB tests of the repository layer. OPT-IN: they are skipped in a normal `npm test`.
 * Run them with `npm run test:db -- --confirm` (see docs/DB-TESTS.md).
 *
 * SAFETY, three locks:
 *  1. Everything happens in a brand-new database named devsia_test_<random>, chosen by scripts/run-db-tests.mjs.
 *  2. Before any write the test checks the connected database name has that prefix and is not the URI's own database. If not, it aborts.
 *  3. The runner removes the app's MONGODB_URI from the environment, and this file replaces it with an unusable address, so nothing in the
 *     app code can reach your content database by accident. At the end only that throwaway database is dropped.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PAGE_DEFS, PAGE_SLUGS, resolveBlocks, type StoredBlock } from "@/lib/cms/blocks";
import { DEFAULT_LEGAL_RECORDS } from "@/lib/cms/legal";
import { DEFAULT_NAVIGATION, navigationFromRecord } from "@/lib/cms/nav";
import type { PostInput } from "@/lib/cms/posts";
import { DEFAULT_SETTINGS_RECORD, settingsFromRecord } from "@/lib/cms/settings";
import { describeDuplicateKey } from "@/lib/cms/duplicate";
import { articles } from "@/lib/content/articles";
import { EXPECTED_INDEXES } from "@/lib/db/expected-indexes.mjs";
import { parseMongoUri } from "@/scripts/lib/mongo-uri.mjs";

const PREFIX = "devsia_test_";
const uri = process.env.DB_TEST_URI ?? "";
const testDb = process.env.DB_TEST_DATABASE ?? "";
const ENABLED = process.env.RUN_DB_TESTS === "1" && uri !== "" && testDb.startsWith(PREFIX);

// Loaded only when the suite is enabled, so a normal `npm test` never loads the database libraries.
type Mongoose = typeof import("mongoose").default;
type Bcrypt = typeof import("bcryptjs");

type Repos = {
  posts: typeof import("@/lib/cms/repo/posts");
  content: typeof import("@/lib/cms/repo/content");
  media: typeof import("@/lib/cms/repo/media");
  leads: typeof import("@/lib/cms/repo/leads");
  users: typeof import("@/lib/cms/repo/users");
  audit: typeof import("@/lib/cms/repo/audit");
  seedAdmin: typeof import("@/lib/cms/repo/seed-admin");
  seedContent: typeof import("@/lib/cms/repo/seed-content");
  throttle: typeof import("@/lib/cms/repo/login-throttle");
  indexes: typeof import("@/lib/db/indexes");
  models: typeof import("@/lib/db/models");
  publicReaders: typeof import("@/lib/cms/public");
  cmsProvider: typeof import("@/lib/content/cms-provider");
};

function postInput(over: Partial<PostInput> = {}): PostInput {
  return {
    title: "Test article",
    slug: "test-article",
    excerpt: "A short summary.",
    body: "## Heading\n\nSome text.",
    category: "Market note",
    categorySlug: "market-note",
    tags: ["one"],
    authorName: "Test Author",
    authorRole: "",
    coverUrl: "",
    coverAlt: "",
    coverCaption: "",
    readMinutes: null,
    featured: false,
    placeholderBody: false,
    publishedDate: "",
    seo: {},
    ...over,
  };
}

const DAY = 86_400_000;

describe.skipIf(!ENABLED)("MongoDB repositories on a throwaway database", () => {
  vi.setConfig({ testTimeout: 30_000, hookTimeout: 90_000 });
  let r: Repos;
  let mongoose: Mongoose;
  let bcrypt: Bcrypt;

  beforeAll(async () => {
    mongoose = (await import("mongoose")).default;
    bcrypt = await import("bcryptjs");
    // Lock 2: refuse to run unless we are provably on the throwaway database.
    const own = parseMongoUri(uri)?.database ?? "";
    if (!testDb.startsWith(PREFIX)) throw new Error("Refusing to run: the test database name does not start with devsia_test_.");
    if (own !== "" && own === testDb) throw new Error("Refusing to run: the test database is the same as the URI's own database.");

    await mongoose.connect(uri, { dbName: testDb, bufferCommands: false, serverSelectionTimeoutMS: 15_000 });
    if (mongoose.connection.name !== testDb || !mongoose.connection.name.startsWith(PREFIX)) {
      await mongoose.disconnect();
      throw new Error(`Refusing to run: connected to "${mongoose.connection.name}", not the throwaway database.`);
    }

    // Lock 3: hand the app code this already-open connection BEFORE it is imported, and make its own URI unusable.
    globalThis.__devsiaMongoose = { conn: mongoose, promise: null, failedAt: null, lastFailure: null };
    process.env.MONGODB_URI = "mongodb://127.0.0.1:1/devsia_test_unused";
    for (const name of ["SEED_ADMIN_NAME", "SEED_ADMIN_EMAIL", "SEED_ADMIN_PASSWORD"]) delete process.env[name];

    r = {
      posts: await import("@/lib/cms/repo/posts"),
      content: await import("@/lib/cms/repo/content"),
      media: await import("@/lib/cms/repo/media"),
      leads: await import("@/lib/cms/repo/leads"),
      users: await import("@/lib/cms/repo/users"),
      audit: await import("@/lib/cms/repo/audit"),
      seedAdmin: await import("@/lib/cms/repo/seed-admin"),
      seedContent: await import("@/lib/cms/repo/seed-content"),
      throttle: await import("@/lib/cms/repo/login-throttle"),
      indexes: await import("@/lib/db/indexes"),
      models: await import("@/lib/db/models"),
      publicReaders: await import("@/lib/cms/public"),
      cmsProvider: await import("@/lib/content/cms-provider"),
    };
    // The app's own first-start setup: indexes, (no admin, because no SEED_* variables), built-in content.
    await (await import("@/lib/db")).getDb();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 1) return;
    // Only ever the throwaway database.
    if (mongoose.connection.name !== testDb || !testDb.startsWith(PREFIX)) return;
    try {
      await mongoose.connection.dropDatabase();
    } catch {
      // The database user may not be allowed to drop a database; empty it collection by collection instead.
      for (const c of await mongoose.connection.db!.listCollections().toArray()) {
        await mongoose.connection.db!.dropCollection(c.name).catch(() => undefined);
      }
    }
    await mongoose.disconnect();
  });

  it("is connected to the throwaway database and nothing else", () => {
    expect(mongoose.connection.name).toBe(testDb);
    expect(mongoose.connection.name.startsWith(PREFIX)).toBe(true);
  });

  it("created every expected index, unique where required, and running again changes nothing", async () => {
    const { MODELS_BY_NAME } = r.models;
    for (const spec of EXPECTED_INDEXES) {
      const model = MODELS_BY_NAME[spec.model as keyof typeof MODELS_BY_NAME];
      const indexes = (await model.collection.indexes()) as Array<{ key: Record<string, number>; unique?: boolean; expireAfterSeconds?: number }>;
      const found = indexes.find((i) => JSON.stringify(i.key) === JSON.stringify(spec.keys));
      expect(found, `${model.collection.name} ${JSON.stringify(spec.keys)}`).toBeTruthy();
      expect(Boolean(found?.unique), `${model.collection.name} unique`).toBe(Boolean(spec.unique));
      if (spec.expireAfterSeconds !== undefined) expect(found?.expireAfterSeconds).toBe(spec.expireAfterSeconds);
    }
    const again = await r.indexes.ensureIndexes();
    expect(again).toEqual({ created: [], failed: [] });
  });

  it("loaded the built-in content once, and audited it", async () => {
    const { PageModel, PostModel, LegalModel, NavigationModel, SettingsModel, SeoTemplateModel, MetaModel } = r.models;
    expect(await PageModel.countDocuments()).toBe(PAGE_SLUGS.length);
    expect(await PostModel.countDocuments()).toBe(articles.length);
    expect(await LegalModel.countDocuments()).toBe(2);
    expect(await NavigationModel.countDocuments()).toBe(1);
    expect(await SettingsModel.countDocuments()).toBe(1);
    expect(await SeoTemplateModel.countDocuments()).toBe(1);
    expect(await MetaModel.exists({ key: "default-content-seeded" })).toBeTruthy();
    expect(await r.seedContent.seedDefaultContent()).toBe("already-seeded");
    const audit = await r.audit.listAudit({ action: "content.seed", page: 1, pageSize: 10 });
    expect(audit.total).toBe(1);
    expect(audit.items[0].actorEmail).toBe("");
  });

  it("creates the first admin only when there are no users, hashes the password, and audits it", async () => {
    expect(await r.models.UserModel.countDocuments()).toBe(0);
    process.env.SEED_ADMIN_NAME = "Test Admin";
    process.env.SEED_ADMIN_EMAIL = "Test.Admin@Example.Test";
    process.env.SEED_ADMIN_PASSWORD = "Throwaway-Only-1234";
    expect(await r.seedAdmin.ensureSeedAdmin()).toBe("created");
    const user = await r.users.findUserWithSecretByEmail("test.admin@example.test");
    expect(user?.role).toBe("super_admin");
    expect(user?.mustChangePassword).toBe(true);
    expect(user?.sessionVersion).toBe(0);
    expect(user?.passwordHash).not.toContain("Throwaway-Only-1234");
    expect(await bcrypt.compare("Throwaway-Only-1234", user?.passwordHash ?? "")).toBe(true);
    expect(await r.seedAdmin.ensureSeedAdmin()).toBe("skipped");
    const audit = await r.audit.listAudit({ action: "user.create", page: 1, pageSize: 10 });
    expect(audit.items.some((a) => a.meta.seeded === true)).toBe(true);
    expect(JSON.stringify(audit.items)).not.toContain("Throwaway-Only-1234");
    for (const name of ["SEED_ADMIN_NAME", "SEED_ADMIN_EMAIL", "SEED_ADMIN_PASSWORD"]) delete process.env[name];
  });

  it("rejects a duplicate email or slug at the database, with a clear message", async () => {
    await r.users.createUser({ name: "A", email: "dupe@example.test", role: "content_editor", passwordHash: "x", mustChangePassword: true });
    const userError = await r.users.createUser({ name: "B", email: "dupe@example.test", role: "content_editor", passwordHash: "x", mustChangePassword: true }).catch((e: unknown) => e);
    expect(describeDuplicateKey(userError)?.field).toBe("email");
    const first = await r.posts.createPost(postInput({ slug: "dupe-slug" }), null, "draft", "test");
    const postError = await r.posts.createPost(postInput({ slug: "dupe-slug" }), null, "draft", "test").catch((e: unknown) => e);
    expect(describeDuplicateKey(postError)?.field).toBe("slug");
    expect(await r.posts.slugTaken("dupe-slug")).toBe(true);
    expect(await r.posts.slugTaken("dupe-slug", first.id)).toBe(false);
    await r.posts.deletePost(first.id);
  });

  it("pages: saves blocks and SEO, reads them back, and reset restores the defaults without losing the SEO", async () => {
    const blocks: StoredBlock[] = PAGE_DEFS.home.defaults().map((b, order) => ({ type: b.type, order, enabled: b.type !== "trust-strip", data: b.type === "hero" ? { ...b.data, title: "Edited headline" } : b.data }));
    await r.content.savePageBlocks("home", "Home", blocks, "test");
    await r.content.savePageSeo("home", "Home", { title: "Custom title", noIndex: true }, "test");
    const page = await r.content.getPage("home");
    expect(page?.blocks.find((b) => b.type === "hero")?.data.title).toBe("Edited headline");
    expect(page?.blocks.find((b) => b.type === "trust-strip")?.enabled).toBe(false);
    expect(page?.seo).toEqual({ title: "Custom title", noIndex: true });
    const resolved = resolveBlocks("home", page?.blocks);
    expect(resolved.some((b) => b.type === "trust-strip")).toBe(false);
    expect(resolved[0].data.title).toBe("Edited headline");
    await r.content.resetPageBlocks("home", "Home", PAGE_DEFS.home.defaults().map((b, order) => ({ type: b.type, order, enabled: true, data: b.data })), "test");
    const reset = await r.content.getPage("home");
    expect(reset?.blocks.find((b) => b.type === "trust-strip")?.enabled).toBe(true);
    expect(reset?.seo.title).toBe("Custom title");
  });

  it("posts: draft, publish, schedule, unpublish, featured, search, delete", async () => {
    const draft = await r.posts.createPost(postInput({ title: "Rare Zebra Report", slug: "zebra-report" }), null, "draft", "test");
    expect(draft.status).toBe("draft");
    expect((await r.posts.listPosts({ q: "zebra", page: 1, pageSize: 10 })).total).toBe(1);
    expect((await r.posts.listPosts({ q: "zebra", status: "published", page: 1, pageSize: 10 })).total).toBe(0);
    expect((await r.posts.listPublicPosts(new Date())).some((p) => p.slug === "zebra-report")).toBe(false);

    await r.posts.updatePost(draft.id, postInput({ title: "Rare Zebra Report", slug: "zebra-report" }), { status: "published", publishedAt: new Date(Date.now() - DAY) }, "test");
    expect((await r.posts.listPublicPosts(new Date())).some((p) => p.slug === "zebra-report")).toBe(true);

    await r.posts.updatePost(draft.id, postInput({ title: "Rare Zebra Report", slug: "zebra-report" }), { publishedAt: new Date(Date.now() + 30 * DAY) }, "test");
    expect((await r.posts.listPublicPosts(new Date())).some((p) => p.slug === "zebra-report")).toBe(false);

    await r.posts.updatePost(draft.id, postInput({ title: "Rare Zebra Report", slug: "zebra-report" }), { status: "draft", publishedAt: new Date(Date.now() - DAY) }, "test");
    expect((await r.posts.listPublicPosts(new Date())).some((p) => p.slug === "zebra-report")).toBe(false);

    const a = await r.posts.createPost(postInput({ slug: "feat-a", featured: true }), null, "draft", "test");
    const b = await r.posts.createPost(postInput({ slug: "feat-b", featured: true }), null, "draft", "test");
    expect((await r.posts.getPost(a.id))?.featured).toBe(false);
    expect((await r.posts.getPost(b.id))?.featured).toBe(true);
    expect(await r.models.PostModel.countDocuments({ featured: true })).toBe(1);

    for (const id of [draft.id, a.id, b.id]) expect(await r.posts.deletePost(id)).toBe(true);
    expect(await r.posts.getPost(draft.id)).toBeNull();
  });

  it("restoring missing defaults brings back deleted content and never overwrites an edit", async () => {
    await r.content.saveSettingsRecord({ ...DEFAULT_SETTINGS_RECORD, phoneDisplay: "+91 98290 00000" }, "test");
    const victim = articles[0].slug;
    const doc = await r.models.PostModel.findOne({ slug: victim }).lean<{ _id: { toString(): string } }>();
    await r.posts.deletePost(String(doc?._id));
    const report = await r.seedContent.restoreMissingDefaults();
    expect(report.posts).toBe(1);
    expect(report.settings).toBe(0);
    expect(settingsFromRecord(await r.content.getSettingsRecord()).phone.display).toBe("+91 98290 00000");
  });

  it("navigation (including header button labels), settings, legal and SEO records round-trip", async () => {
    await r.content.saveNavigationRecord({ ...DEFAULT_NAVIGATION, headerButtons: { associateLabel: "Partner with us", enquiryLabel: "Ask an advisor" } }, "test");
    const nav = navigationFromRecord(await r.content.getNavigationRecord());
    expect(nav.headerButtons).toEqual({ associateLabel: "Partner with us", enquiryLabel: "Ask an advisor" });

    await r.content.saveLegalRecord("privacy", { ...DEFAULT_LEGAL_RECORDS[0], title: "Privacy notice" }, "test");
    expect((await r.content.getLegalRecord("privacy"))?.title).toBe("Privacy notice");
    expect((await r.content.listLegalRecords()).map((l) => l.slug)).toEqual(["privacy", "terms"]);

    await r.content.saveSeoTemplate({ titleTemplate: "{title} | DevSia", descriptionTemplate: "{type} in {location}", ogImage: "" }, "test");
    expect((await r.content.getSeoTemplate())?.titleTemplate).toBe("{title} | DevSia");

    await r.content.savePropertySeoOverride("some-listing", { title: "Override" }, "test");
    expect((await r.content.getPropertySeoOverride("some-listing"))?.seo.title).toBe("Override");
    expect((await r.content.listPropertySeoOverrides()).length).toBe(1);
    await r.content.deletePropertySeoOverride("some-listing");
    expect(await r.content.getPropertySeoOverride("some-listing")).toBeNull();
  });

  it("media records: create, list, edit the description, delete (no upload, no Blob)", async () => {
    const m = await r.media.createMedia({ url: "https://x.public.blob.vercel-storage.com/a.jpg", pathname: "media/a.jpg", filename: "a.jpg", contentType: "image/jpeg", size: 10, alt: "", uploadedBy: "test" });
    expect((await r.media.listMedia()).length).toBe(1);
    await r.media.updateMediaAlt(m.id, "A photo");
    expect((await r.media.getMedia(m.id))?.alt).toBe("A photo");
    await r.media.deleteMediaRecord(m.id);
    expect(await r.media.getMedia(m.id)).toBeNull();
  });

  it("leads mirror: records, lists with filters, opens one, and counts recent ones", async () => {
    await r.leads.recordLead({ kind: "enquiry", name: "Asha Rao", phone: "9845671230", payload: { fullName: "Asha Rao", budgetBand: "25-50l" }, pageEnquired: "/enquire" });
    await r.leads.recordLead({ kind: "associate", name: "Ravi Menon", phone: "9845671231", payload: { fullName: "Ravi Menon" }, pageEnquired: "" });
    expect((await r.leads.listLeads({ page: 1, pageSize: 10 })).total).toBe(2);
    expect((await r.leads.listLeads({ kind: "associate", page: 1, pageSize: 10 })).items[0].name).toBe("Ravi Menon");
    const found = await r.leads.listLeads({ q: "Asha", page: 1, pageSize: 10 });
    expect(found.total).toBe(1);
    const one = await r.leads.getLead(found.items[0].id);
    expect(one?.crmStatus).toBe("not_integrated");
    expect(one?.payload.budgetBand).toBe("25-50l");
    expect(await r.leads.leadCountLastDays(1)).toBe(2);
  });

  it("users: roles, access, lockout fields, and a password change ends older sessions", async () => {
    const user = await r.users.createUser({ name: "Editor", email: "editor@example.test", role: "content_editor", passwordHash: "hash", mustChangePassword: true });
    expect(user.sessionVersion).toBe(0);
    await r.users.recordLoginFailure(user.id, { failedAttempts: 5, lockedUntil: new Date(Date.now() + 60_000) });
    expect((await r.users.findUserWithSecretByEmail("editor@example.test"))?.failedAttempts).toBe(5);
    await r.users.setUserPassword(user.id, "new-hash", false);
    const after = await r.users.findUserWithSecretByEmail("editor@example.test");
    expect(after?.sessionVersion).toBe(1);
    expect(after?.failedAttempts).toBe(0);
    expect(after?.lockedUntil).toBeNull();
    expect(after?.mustChangePassword).toBe(false);
    await r.users.recordLoginSuccess(user.id);
    expect((await r.users.getUser(user.id))?.lastLoginAt).not.toBeNull();
    const before = await r.users.countActiveSuperAdmins();
    await r.users.updateUserAccess(user.id, { role: "super_admin" });
    expect(await r.users.countActiveSuperAdmins()).toBe(before + 1);
    await r.users.updateUserAccess(user.id, { active: false });
    expect(await r.users.countActiveSuperAdmins()).toBe(before);
    expect((await r.users.listUsers()).length).toBeGreaterThanOrEqual(3);
  });

  it("audit log: writes, filters by area and search, and lists the newest first", async () => {
    await r.audit.writeAudit({ actor: { id: "1", email: "who@example.test", role: "super_admin" }, action: "post.update", entityType: "post", entityId: "abc", summary: "Post zebra: changed title" });
    await r.audit.writeAudit({ actor: null, action: "settings.update", entityType: "settings", summary: "Settings: changed email" });
    const posts = await r.audit.listAudit({ action: "post.", page: 1, pageSize: 10 });
    expect(posts.items.every((a) => a.action.startsWith("post."))).toBe(true);
    expect((await r.audit.listAudit({ q: "zebra", page: 1, pageSize: 10 })).total).toBeGreaterThanOrEqual(1);
    const recent = await r.audit.recentAudit(3);
    expect(recent[0].at >= recent[1].at).toBe(true);
  });

  it("per-network sign-in throttle: blocks after 20 failures, per address, and lets go after the window", async () => {
    const now = new Date();
    let blockedAt = 0;
    for (let i = 1; i <= 20; i++) {
      const { justBlocked } = await r.throttle.recordNetworkFailure("addr-a", now);
      if (justBlocked) blockedAt = i;
    }
    expect(blockedAt).toBe(20);
    expect(await r.throttle.isNetworkBlocked("addr-a", now)).toBe(true);
    expect(await r.throttle.isNetworkBlocked("addr-b", now)).toBe(false);
    expect(await r.throttle.isNetworkBlocked("addr-a", new Date(now.getTime() + 16 * 60_000))).toBe(false);
  });

  it("what the public site reads: saved settings, navigation, page blocks and only published articles", async () => {
    const settings = await r.publicReaders.getSiteSettings();
    expect(settings.phone.display).toBe("+91 98290 00000");
    expect(settings.phone.tel).toBe("+919829000000");
    expect((await r.publicReaders.getNavigation()).headerButtons.enquiryLabel).toBe("Ask an advisor");
    expect((await r.publicReaders.getPageBlocks("about")).length).toBeGreaterThan(0);

    const provider = r.cmsProvider.createCmsContentProvider();
    const listed = await provider.getArticles({ page: 1, pageSize: 50 });
    expect(listed.total).toBe(articles.length);
    await r.posts.createPost(postInput({ slug: "hidden-draft" }), null, "draft", "test");
    expect((await provider.getArticles({ page: 1, pageSize: 50 })).items.some((a) => a.slug === "hidden-draft")).toBe(false);
    await r.posts.createPost(postInput({ slug: "no-index-post", seo: { noIndex: true } }), new Date(Date.now() - DAY), "published", "test");
    const noindex = (await provider.getArticles({ page: 1, pageSize: 50 })).items.find((a) => a.slug === "no-index-post");
    expect(noindex?.seo?.noIndex).toBe(true);
    expect((await provider.getLegalDocuments()).map((d) => d.id)).toEqual(["privacy", "terms"]);
  });
});
