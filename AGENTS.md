# Project guidance

Workshop, ticketing and attendance platform for MIMESISS / ASMM. Romanian-language UI, deployed on
Vercel.

## Attribution rule

Do not mention AI coding assistants or automated development tools by name in site content, metadata,
project documentation, source comments, or commit messages. Use neutral descriptions of the project
and its maintainers. Keep local runtime paths configurable rather than tied to a particular tool.

## Stack

Next.js 16 (App Router, `src/`) · React 19 · TypeScript strict · Tailwind CSS 3 · Clerk auth ·
MongoDB/Mongoose · Stripe · `react-icons`.

No Supabase, no Postgres, no lucide-react — older docs in this repo used to claim otherwise.

## Commands

```bash
npm run dev        # Turbopack dev server
npm run build      # production build (webpack, explicitly)
npm run lint       # ESLint flat config
npm run typecheck  # tsc --noEmit
```

Local database:

```bash
docker run -d --name mimesiss-mongo -p 27017:27017 mongo:7
```

Configure required environment variables in `.env.local` before running the app. Database and payment
features require their respective credentials.

## Things worth knowing before editing

- **Middleware is `src/proxy.ts`**, not `middleware.ts` — Next 16 renamed it.
- **The root layout hits the database.** `layout.tsx` calls `getAppSettings()`, so Mongo is on the
  critical path for every page, and a production build needs a reachable database.
- **Roles live in Mongo, not Clerk.** Use `getUserRole()` / `isUserAdmin()` from `src/lib/auth.ts`,
  and call `syncUserWithDatabase()` before relying on a role. Always re-check server-side.
- **Colour has exactly one source of truth**: the `:root` block in `src/app/globals.css`.
  `tailwind.config.js` maps tokens to `hsl(var(--x) / <alpha-value>)` — the alpha suffix is load
  bearing, since ~220 call sites use modifiers like `bg-card/80`. Never hardcode a brand hex in a
  component. For canvas, Stripe Elements, or manifests, import `BRAND` from `src/lib/brand.ts`.
- **QR codes use `BRAND.primaryDeep`**, not `primary` — the UI blue is only 2.78:1 on white and
  would degrade scan reliability.
- **Dark-only.** `<html class="dark">` is hardcoded with no toggle; the class remains because some
  `dark:` variants on stock palette colours depend on it.
- **App behaviour is settings-driven.** `eventMode`, `paymentsEnabled`, `globalRegistrationEnabled`
  and `workshopVisibleToPublic` live in the `appsettings` collection, so a page rendering "empty"
  is often correct rather than broken.
- **QR scanning uses the native `BarcodeDetector` API**, which Safari and Firefox do not support.
  `QRScanner.tsx` detects this and falls back to manual ticket-number lookup.

## Conventions

For performance changes, follow `docs/performance-rules.md`. Use
`lighthouserc.cjs` for repeatable public-route audits against a production build.
Record before/after measurements and preserve authorization and cache invalidation.

Server components by default; `'use client'` only for interactivity. The codebase favours route
handlers plus `fetch` over server actions — follow whichever pattern the file already uses. Always
`await connectDB()` before touching a model. Surface errors to the user rather than swallowing them.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
