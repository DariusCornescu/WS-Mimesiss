# Mimesiss — Copilot Instructions

Workshop, ticketing and attendance platform for MIMESISS / ASMM. Romanian-language UI.

## Tech Stack

- **Framework**: Next.js 16, App Router, `src/` directory
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS 3
- **Authentication**: Clerk (`@clerk/nextjs`)
- **Database**: MongoDB via Mongoose
- **Payments**: Stripe
- **Icons**: `react-icons` (mostly `react-icons/fa`)

There is **no Supabase, no Postgres, no Prisma, and no lucide-react** in this project.

## Project Structure

- `src/app/` — routes, layouts, and API route handlers
- `src/components/` — React components (`admin/`, `dashboard/`, `payments/`, `ui/`, `moderator/`)
- `src/lib/` — `mongodb.ts` (connection cache), `auth.ts` (Clerk↔Mongo sync), `settings.ts`,
  `stripe.ts`, `brand.ts`
- `src/models/` — Mongoose schemas
- `src/types/` — TypeScript types
- `src/proxy.ts` — Clerk middleware (Next 16 renamed `middleware.ts` to `proxy.ts`)

## Authentication & Authorization

- Clerk handles sessions; `src/proxy.ts` protects `/dashboard` and `/admin`.
- Roles (`user` / `moderator` / `admin`) live on the Mongo user document, not in Clerk.
  Read them via `getUserRole()` / `isUserAdmin()` in `src/lib/auth.ts`.
- `syncUserWithDatabase()` upserts the Clerk user into Mongo — call it before relying on a role.
- Always re-check the role server-side in admin routes. Never trust the client.

## Colour and styling

- **One source of truth**: the CSS custom properties in `src/app/globals.css` (`:root`).
  `tailwind.config.js` maps every token to `hsl(var(--x) / <alpha-value>)`.
- Use the semantic tokens (`bg-card`, `text-primary`, `border-border`) rather than raw hex or
  palette colours. Never add a hardcoded brand hex to a component.
- For contexts that cannot read CSS variables — canvas/QR rendering, the Stripe Elements
  appearance API, web manifests — import `BRAND` from `src/lib/brand.ts`.
- QR codes use `BRAND.primaryDeep`, not `BRAND.primary`, for scan contrast.
- The app is dark-only: `<html class="dark">` is hardcoded and there is no theme toggle.
- Reusable component classes are defined in `globals.css` as `mimesiss-*`
  (note: `mimesiss-btn-primary`, not `mimesiss-button-primary`).

## Code Style

- Data fetching in server components by default; `'use client'` only when you need interactivity.
- The codebase uses **route handlers plus `fetch`** far more than server actions. Follow the
  pattern already in the file you are editing.
- Always `await connectDB()` before touching a Mongoose model.
- Handle loading and error states explicitly; surface failures to the user rather than swallowing
  them in an empty `.catch()`.

## Commands

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build (webpack, explicitly)
- `npm run lint` — ESLint flat config
- `npm run typecheck` — `tsc --noEmit`
