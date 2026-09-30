# DevSia website (rebuild)

Rebuild of the DevSia website (devsia.in) from the recovered original materials.
**Current status: Phase 3, backend foundation and admin CMS (MongoDB, Auth.js).** All public pages exist (see `docs/PHASE2-INVENTORY.md`), plus an admin panel at `/admin` (see `docs/PHASE3.md`),
and **the PropDesk CRM is not integrated**: properties and form submissions use local mock providers.

Stack: Next.js 16 (App Router), React 19, TypeScript. MongoDB, Auth.js and Vercel Blob arrive in a later phase.
Hosting target: Vercel, under your own GitHub and Vercel accounts. `devsia.in` is **not** connected yet.

## Requirements

- Node.js 20.9 or newer (`.nvmrc` says 20)
- npm

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. In development only, http://localhost:3000/dev/foundation shows the design system
(colors, type, buttons, badges, form controls). That page returns 404 in production builds.

No environment variables are needed in Phase 1. To set any, copy `.env.example` to `.env.local`.

## Checks

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint (flat config, Next 16 style)
npm test            # Vitest
npm run build       # production build
```

## Structure

See `docs/ARCHITECTURE.md` for the folder map, the phase plan, the CRM integration boundary and the list of
UNKNOWN / TEMPORARY / ASSUMED items.

```
app/                 routes (layout, temporary placeholder, dev-only preview)
components/ui/       base components (Button, fields, Section, Badge, Skeleton, ...)
lib/                 env helper, design constants; service, DB, auth folders are empty until their phase
styles/              fonts, design tokens, base, typography, utilities
public/fonts/        self-hosted Plus Jakarta Sans
tests/               Vitest tests
docs/                architecture and decisions
```

## Rules for this project

- Do not use the original developer's GitHub or Vercel accounts.
- Do not connect `devsia.in` until the site is built, tested locally and deployed to your Vercel project.
- Never commit `.env.local` or any secret.
- Do not invent CRM details. Anything the vendor has not confirmed stays marked UNKNOWN or TEMPORARY.
