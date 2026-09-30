# DevSia architecture (Phase 1)

Sources: the DevSia Rebuild Specification, the Re-evaluation tab and the API contract tab (vendor PDF), the
handover documentation, the original Home design artifact and the website walkthrough video.
Labels: **CONFIRMED** (a source states it), **ASSUMED** (my choice, needs review), **UNKNOWN**, **TEMPORARY**.

## Hosting and control

GitHub (yours) -> Vercel (yours) -> Next.js app -> MongoDB -> Vercel Blob (when needed) -> PropDesk CRM (later).
The domain is managed at GoDaddy and is connected only at the end.

## Folder map

```
app/
  layout.tsx                 root layout: fonts, tokens, base styles, TEMPORARY metadata
  (public)/page.tsx          TEMPORARY placeholder for "/" (real Home: Phase 2)
  dev/foundation/            dev-only design system preview, 404 in production
components/
  ui/                        base components (built)
  layout/                    Header, Footer, page shell (Phase 2)
  blocks/                    one component per CMS block (Phase 2)
  forms/                     enquiry, associate, contact forms (Phase 4)
  property/                  cards, gallery, filters (Phase 3)
  insights/                  article cards and detail parts (Phase 5)
lib/
  env.ts                     env registry and helpers (built)
  cn.ts, design/             helpers and breakpoint constants (built)
  services/                  provider interfaces: getProperties, getProperty, submitLead, registerAssociate (Phase 3)
  mock/                      mock/local provider implementations (Phase 3)
  propdesk/                  real PropDesk provider, added only after CRM confirmation
  db/  auth/                 MongoDB models, Auth.js and permissions (Phase 2)
  security/                  honeypot, minimum fill time, rate limit, duplicate phone (Phase 4)
  seo/                       metadata builders (Phase 7)
  blob/                      media upload helpers (Phase 2)
store/                       Redux wishlist slice (Phase 3)
styles/                      fonts, tokens, base, typography, utilities (built)
tests/                       Vitest tests
```

Empty folders hold a `.gitkeep`. They are placeholders for the structure in the specification, not features.

## CRM integration boundary (not built yet)

The frontend will only ever call four functions on a provider interface:

`getProperties()`, `getProperty()`, `submitLead()`, `registerAssociate()`.

A mock provider implements them first. The real PropDesk provider replaces it later without frontend changes.
Confirmed facts that will shape the real provider: Bearer auth on every endpoint, a required agency ID,
`GET /api/properties/public` for listings (params: agency_id, limit, page, type, location, featured),
`POST /api/leads/capture`, `POST /api/v1/associates/register`, and **no** detail endpoint (detail comes from the list).

**UNKNOWN, do not guess:** the API base URL, every response and error body, the listing field names, slug or id,
maximum page size, and endpoints for the About message, callback, Register interest, Download brochure and
Book a site visit forms. Mock data must not pretend to answer these.

## Phase plan

| Phase | Scope |
| --- | --- |
| 1 | Foundation (this phase) |
| 2 | Layout shell (header, footer), Home page, MongoDB, Auth.js, admin skeleton |
| 3 | Property service abstraction, mock data, listing, detail, filters, wishlist |
| 4 | Enquiry and associate forms with mock submission, honeypot, fill time |
| 5 | Insights, About, Legal |
| 6 | Admin CMS screens |
| 7 | SEO, sitemap, robots, structured data |
| 8 | Tests hardening, deployment to your Vercel |

Phases may be re-split as we go. Each phase waits for your approval.

## Decisions made in Phase 1

- **Styling: plain CSS with design tokens plus CSS Modules, no Tailwind (ASSUMED; decision D1 was open).**
  The original prototype is hand-written CSS with custom properties, so this reproduces it most exactly with no
  extra dependency. Easy to revisit before Phase 2.
- **Fonts self-hosted** from the files embedded in the original design (variable, weights 400 to 800, four subsets).
  This avoids a build-time network fetch and preserves the rupee sign (in the latin-ext subset).
- **Only dependencies needed now:** next, react, react-dom, typescript, ESLint, Vitest with Testing Library and jsdom.
  Test framework is ASSUMED (the original's is UNKNOWN). MongoDB, Auth.js, Vercel Blob and Redux are added in their phases.
- **No env variable is required**; the registry in `lib/env.ts` records which phase needs which.

## Deviations from the original design (deliberate)

- Link-buttons keep their label color on hover (the original prototype recolored them red through a global rule).
- Scroll-in animation is applied only in browsers that support scroll-driven animations.
- Reduced-motion also stops infinite animations.

## ASSUMED / TEMPORARY register

- Security header values in `next.config.ts` (the handover names the headers but not their values). TEMPORARY.
- Root metadata title and description. TEMPORARY.
- Field error text style, disabled button opacity, checked checkbox look, skeleton shimmer, red required asterisk. ASSUMED from the video.
- Design tokens in the ASSUMED group of `styles/tokens.css`.
- `/dev/foundation` and the placeholder home page. TEMPORARY.
- Not set: favicon, logo, Open Graph image (none recovered), image remote patterns (CRM image host UNKNOWN),
  Content-Security-Policy and HSTS (in no source).

## Not verified in the build environment

Dependencies could not be installed where this was written (no npm registry access), so `npm install`,
`npm run build`, `npm run lint`, `npm run typecheck` and `npm test` have **not** been run. See the Phase 1 report.


## Phase 2 additions

- **Routes**: see `docs/PHASE2-INVENTORY.md`. Pages live in `app/(public)`; API routes in `app/api/v1`; sitemap and robots in `app/`.
- **Data layer**: pages never touch mock data directly. `lib/services` (properties, leads) and `lib/content` (articles, legal, upcoming projects) each expose an interface plus a registry (`getPropertyProvider`, `getLeadProvider`, `getContentProvider`). PropDesk goes in `lib/propdesk/` and is selected in `lib/services/index.ts`. MongoDB goes behind `ContentProvider`.
- **Forms**: `lib/forms` holds options, validation, spam checks and `submission.ts`, which the API routes and the server action both call. Only mock providers exist. The honeypot name and minimum fill time are TEMPORARY.
- **State**: the wishlist is Redux Toolkit plus localStorage (`store/`). Only slugs are stored.
- **Flags**: `lib/config/features.ts` holds `NEW_PROJECTS_LIVE` (false, so `/new-projects` is a 404).
- **Rendering**: property and article pages use `force-dynamic` because their data will come from the CRM and CMS.
- **New dependencies**: `@reduxjs/toolkit`, `react-redux`, and (dev) `@testing-library/user-event`.

## Logo and responsive rules (post-Phase 2 update)

- **Logo**: the supplied file is stored unchanged at `public/images/brand/devsia-logo.jpeg` and shown by `components/layout/Logo.tsx`. The file is a 1254 x 1254 square with a wide white margin, so a CSS frame shows only the wordmark and a 10 px margin (pixels are not altered, stretched or recoloured). In the dark footer it sits on a white plate because the navy wordmark would vanish on navy. Heights: 42 px desktop, 38 px tablet, 34 px phone, 30 px below 360 px.
- **Breakpoints** are unchanged: 1199 px and 809 px. Below 810 px: buttons and links are at least 44 px tall, form fields use 16 px text (stops iOS zooming on focus), the listing filters collapse behind a "Show filters" button, and cards are one tap target.
- **Grid rule**: a single-column grid that holds wide content (tab rows, tables, forms) must use `grid-template-columns: minmax(0, 1fr)`. A plain `display: grid` lets a nowrap row widen the whole column.
- **Container rule**: never override a Container's horizontal padding from a page class. Use `padding-top` and `padding-bottom`.

## Phase 3 additions

See `docs/PHASE3.md` for the file lists, roles, collections, routes and environment variables.

- **Never trust the layout**: every admin page calls `requireUser` / `requireCapability`, and every server action goes through `runAction` (`lib/auth/guard.ts`), which re-checks the session, the active flag, a pending password change and the capability. A test scans the source to make sure a new page or action cannot skip this.
- **Server only**: database, repositories, auth internals and password code import `server-only`. Tests fail if a client component imports them.
- **CMS content model**: page text is stored as blocks (`lib/cms/blocks.ts`, pure and shared by the browser editor and the server validator). Article and legal text are stored as plain text in a small syntax (`lib/cms/body-syntax.ts`) and turned into the blocks the public pages already render. Nothing is stored or rendered as HTML.
- **Fallback rule**: no `MONGODB_URI` means built-in content; a database error is logged and also falls back. Property data is never cached in or faked by the CMS.
- **Leads**: `withLeadMirror` (lib/forms/mirror.ts) wraps whichever provider is in use. PropDesk will replace the mock provider in `lib/services/index.ts`; the mirror keeps wrapping it.
- **Audit**: entries record the actor, action and the NAMES of changed fields, never values, passwords or personal data.
