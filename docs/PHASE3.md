# Phase 3: backend foundation, MongoDB and admin CMS

Built on top of Phase 2. No Phase 1 or Phase 2 route, component, design or behaviour was removed. **PropDesk is not integrated**
and no CRM request exists anywhere in the code (a test enforces this).

## How it fits together

- **Public site**: reads content through `lib/cms/public.ts` and the content provider. With `MONGODB_URI` unset, or the database unreachable,
  it shows the built-in Phase 2 content, exactly as before. Nothing is faked.
- **First start with a database**: the users collection is empty, so the admin from `SEED_ADMIN_*` is created (must change password),
  and the built-in pages, articles, legal text, navigation and settings are loaded once so the CMS starts equal to the live site.
  A marker stops later restarts re-creating anything an editor deleted.
- **Admin** (`/admin`): Auth.js credentials sign-in, role checks on the server for every page and every server action.
- **Properties and leads**: still the mock providers. Submitted forms are also copied to MongoDB (the "leads mirror"), flagged "CRM not connected".

## Roles

Source: Handover section 02 (screens and capabilities) plus the Rebuild Specification grant matrix. **Super admin holding `seo.manage`
is implied by "full access", not stated.**

| Capability | super_admin | content_editor | seo_manager |
|---|---|---|---|
| pages.manage (pages, legal) | yes | yes | no |
| blogs.manage | yes | yes | no |
| nav.manage | yes | yes | no |
| media.manage | yes | yes | no |
| leads.view | yes | yes | no |
| seo.manage | yes | no | yes |
| settings.manage | yes | no | no |
| roles.manage | yes | no | no |
| audit.view | yes | no | no |

## MongoDB collections

`users`, `pages`, `posts`, `navigations`, `settings`, `seotemplates`, `propertyseooverrides`, `legaldocuments`, `media`, `leads`, `auditlogs`, `metas`
(Mongoose model names; there is deliberately no properties collection). Defined in `lib/db/models/index.ts`.

## Admin routes

`/admin/login`, `/admin` (dashboard), `/admin/pages`, `/admin/pages/[slug]`, `/admin/blogs`, `/admin/blogs/new`, `/admin/blogs/[id]`,
`/admin/nav`, `/admin/media`, `/admin/seo`, `/admin/seo/pages/[slug]`, `/admin/seo/property/[slug]`, `/admin/legal`, `/admin/settings`,
`/admin/leads`, `/admin/leads/[id]`, `/admin/roles`, `/admin/audit`, `/admin/profile`, `/admin/forbidden`, plus `/api/auth/[...nextauth]`.

## Environment variables

`MONGODB_URI`, `AUTH_SECRET`, `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_SITE_URL`.
All server-side except the site URL. PropDesk variables stay commented out.

## New dependencies

`mongoose`, `next-auth` (Auth.js v5 beta), `bcryptjs`, `@vercel/blob`, `server-only`.

## Files created (98)

- `app/admin/(console)/audit/page.tsx`
- `app/admin/(console)/blogs/[id]/page.tsx`
- `app/admin/(console)/blogs/new/page.tsx`
- `app/admin/(console)/blogs/page.tsx`
- `app/admin/(console)/error.tsx`
- `app/admin/(console)/forbidden/page.tsx`
- `app/admin/(console)/layout.tsx`
- `app/admin/(console)/leads/[id]/page.tsx`
- `app/admin/(console)/leads/page.tsx`
- `app/admin/(console)/legal/page.tsx`
- `app/admin/(console)/media/page.tsx`
- `app/admin/(console)/nav/page.tsx`
- `app/admin/(console)/page.tsx`
- `app/admin/(console)/pages/[slug]/page.tsx`
- `app/admin/(console)/pages/page.tsx`
- `app/admin/(console)/profile/page.tsx`
- `app/admin/(console)/roles/page.tsx`
- `app/admin/(console)/seo/page.tsx`
- `app/admin/(console)/seo/pages/[slug]/page.tsx`
- `app/admin/(console)/seo/property/[slug]/page.tsx`
- `app/admin/(console)/settings/page.tsx`
- `app/admin/actions/auth.ts`
- `app/admin/actions/content.ts`
- `app/admin/actions/legal.ts`
- `app/admin/actions/media.ts`
- `app/admin/actions/nav.ts`
- `app/admin/actions/pages.ts`
- `app/admin/actions/posts.ts`
- `app/admin/actions/profile.ts`
- `app/admin/actions/seo.ts`
- `app/admin/actions/settings.ts`
- `app/admin/actions/users.ts`
- `app/admin/layout.tsx`
- `app/admin/login/page.tsx`
- `app/api/auth/[...nextauth]/route.ts`
- `auth.ts`
- `components/admin/AdminForm.tsx`
- `components/admin/AdminNav.tsx`
- `components/admin/AdminShell.tsx`
- `components/admin/AdminUi.tsx`
- `components/admin/BlockEditor.tsx`
- `components/admin/ConfirmSubmit.tsx`
- `components/admin/ImageField.tsx`
- `components/admin/MediaAdmin.tsx`
- `components/admin/MediaPicker.tsx`
- `components/admin/NavEditor.tsx`
- `components/admin/PostEditor.tsx`
- `components/admin/SeoFieldset.tsx`
- `components/admin/UserRow.tsx`
- `components/admin/admin.module.css`
- `components/providers/SiteSettingsProvider.tsx`
- `lib/admin/action-state.ts`
- `lib/admin/form-data.ts`
- `lib/admin/media-options.ts`
- `lib/admin/nav.ts`
- `lib/auth/authorize.ts`
- `lib/auth/capabilities.ts`
- `lib/auth/guard.ts`
- `lib/auth/lockout.ts`
- `lib/auth/password-policy.ts`
- `lib/auth/password.ts`
- `lib/auth/session.ts`
- `lib/cms/audit.ts`
- `lib/cms/blocks.ts`
- `lib/cms/body-syntax.ts`
- `lib/cms/legal.ts`
- `lib/cms/media.ts`
- `lib/cms/nav.ts`
- `lib/cms/pagination.ts`
- `lib/cms/posts.ts`
- `lib/cms/public.ts`
- `lib/cms/repo/audit.ts`
- `lib/cms/repo/content.ts`
- `lib/cms/repo/leads.ts`
- `lib/cms/repo/media.ts`
- `lib/cms/repo/posts.ts`
- `lib/cms/repo/seed-admin.ts`
- `lib/cms/repo/seed-content.ts`
- `lib/cms/repo/users.ts`
- `lib/cms/seo.ts`
- `lib/cms/settings.ts`
- `lib/cms/types.ts`
- `lib/cms/users.ts`
- `lib/cms/validate.ts`
- `lib/content/cms-provider.ts`
- `lib/db/bootstrap.ts`
- `lib/db/connection.ts`
- `lib/db/index.ts`
- `lib/db/models/index.ts`
- `lib/forms/mirror.ts`
- `tests/auth/capabilities.test.ts`
- `tests/cms/blocks.test.ts`
- `tests/cms/body-syntax.test.ts`
- `tests/cms/seo-posts-settings.test.ts`
- `tests/cms/validate.test.ts`
- `tests/forms/mirror.test.ts`
- `tests/security/static-guards.test.ts`
- `types/next-auth.d.ts`

## Files modified (30)

- `.env.example`
- `app/(public)/about/page.tsx`
- `app/(public)/associates/page.tsx`
- `app/(public)/enquire/page.tsx`
- `app/(public)/insights/[slug]/page.tsx`
- `app/(public)/insights/page.tsx`
- `app/(public)/layout.tsx`
- `app/(public)/legal/page.tsx`
- `app/(public)/new-projects/page.tsx`
- `app/(public)/page.tsx`
- `app/(public)/properties/[slug]/page.tsx`
- `app/(public)/properties/page.tsx`
- `app/robots.ts`
- `app/sitemap.ts`
- `components/forms/AssociateForm.tsx`
- `components/forms/EnquiryForm.tsx`
- `components/home/HomeSections.tsx`
- `components/layout/SiteFooter.tsx`
- `components/layout/SiteHeader.tsx`
- `components/property/PropertyCard.tsx`
- `components/property/PropertyDetail.tsx`
- `components/property/PropertyGrid.tsx`
- `components/wishlist/WishlistView.tsx`
- `lib/content/index.ts`
- `lib/content/types.ts`
- `lib/env.ts`
- `lib/seo/metadata.ts`
- `lib/services/index.ts`
- `next.config.ts`
- `package.json`

## Fix round after the first delivery

Approved fixes made without changing the architecture:

- **Editable text:** Insights heading, intro and article-callback message (new `insights-hero` block, so Insights is now an editable page); the Enquire side panel (new `enquire-side-panel` block); the message shown after each form is sent (fields on the `form-intro` and `company-contact` blocks); the two header button labels (Navigation editor). Pages saved before these existed pick up the built-in text automatically. The hero image is unchanged.
- **Indexes:** one list (`lib/db/expected-indexes.mjs`). The app adds any missing index at startup with `createIndex` only (nothing is dropped or changed). `npm run db:check` compares them read-only.
- **Uploads:** Server Action body limit raised to 4.5 MB so the 4 MB upload limit is reachable; the form warns before sending an oversized file. Uploads stay off without `BLOB_READ_WRITE_TOKEN`.
- **Sitemap:** articles marked noindex are excluded.
- **Sessions:** each user has a session version that rises on every password change or reset; older sessions stop working. Changing your own password signs you out everywhere, including this browser, and sends you to sign in again. Sessions from before this feature stay valid until then. The 8-hour lifetime is unchanged.
- **Audit:** sign-out, first-admin creation and first-start content loading are now logged (`auth.logout`, `user.create` marked seeded, `content.seed`), and so are throttled networks (`auth.throttled`).
- **Database outage:** after a failed connection, further attempts are refused instantly for 15 seconds, so pages fall back to the built-in content without waiting 5 seconds per query. Then one attempt is made again.
- **Sign-in throttle:** 20 failed sign-ins in 15 minutes from one network are refused, on top of the per-account lockout. Counters live in MongoDB (`loginattempts`, expire by themselves) and store only a keyed hash of the address. No new service. It relies on the hosting platform's `X-Forwarded-For` (trustworthy on Vercel) and is best effort.
- **Duplicate keys:** a duplicate email or slug now gives a clear message on the field.
- **Bug found and fixed:** the Navigation editor read its field errors above the form that supplies them, so the footer heading's error never showed. A test now guards this.
- **Tests:** opt-in real-database repository tests (`docs/DB-TESTS.md`).

New collection: `loginattempts` (13 in total). New user field: `sessionVersion`.

