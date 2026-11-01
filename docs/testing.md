# Testing

This document lists the automated checks in this repository, what each one covers, what is deliberately not covered, and how to run them.

## Suites at a glance

| Command | Runner | Scope |
|---|---|---|
| `npm run test:unit` | Vitest | Unit, component and direct route-handler tests (`tests/unit`, `tests/component`, `tests/integration`) |
| `npm run test:security` | `node --test` | Registration profile and security regression scripts |
| `npm run test:payments` | `node --test` + in-memory MongoDB | Payment persistence, rollback and idempotency against an isolated database |
| `npm run test:e2e` | Playwright | Browser tests against a loopback production build or a `*.vercel.app` preview |
| `npm run test:e2e:list` | Playwright | Lists browser tests without launching a browser (still requires `E2E_BASE_URL`) |

The existing `ci.yml` workflow runs secret scanning, the security and isolated MongoDB suites, lint, typecheck and build. `test-suite.yml` adds `test:unit` on pushes and pull requests, plus a manually dispatched browser run against a preview.

## Unit, component and direct handler tests (Vitest)

- `tests/unit/validation.test.ts`: input validation schemas.
- `tests/unit/registration-profile.test.ts`: registration profile rules.
- `tests/unit/public-routes.test.ts`: public-surface path classification for presentation. These are not authorization checks; server authorization is checked separately.
- `tests/unit/e2e-target.test.ts`: the browser target and authentication guards in `tests/e2e/support/target.ts` (production hosts, paths, credentials, query strings, preview HTTPS, opt-in requirements).
- `tests/integration/users-clerkId-route.test.ts`: the `/api/users/[clerkId]` route handler, called directly with mocked authentication and data access.
- `tests/integration/security-route-inventory.test.ts`: static inventory of every `src/app/api/**/route.ts`. A new route fails until it is listed with its methods and access gate.
- `tests/integration/security-proxy.test.ts`: `src/proxy.ts` origin check, JSON 401 for `/api/admin`, webhook exemption and Clerk protection of `/dashboard` and `/admin` (Clerk replaced by a pass-through).
- `tests/integration/security-qr-redirect.test.ts`, `security-staff-routes.test.ts`, `security-public-reads.test.ts` and `tests/unit/security-config.test.ts`: audit regression tests. Tests written as `it.fails` pin a known gap: they pass while the gap exists and start failing once it is fixed, at which point remove `.fails`.
- `tests/component/association-header.test.tsx`: `AssociationHeader` menu toggle state, modal dialog semantics, initial focus, Tab and Shift+Tab containment, focus restoration on Escape and on the close button, backdrop close, scroll lock release, closing on route change, congress group expansion and reset, `aria-current` marking and signed-in/signed-out controls.

Limits:

- jsdom has no CSS layout. Component tests check DOM state, ARIA attributes and focus, not visual layout or breakpoint visibility; those are exercised by the `mobile-webkit` browser project.
- Async Server Components cannot be rendered by React Testing Library. Pages implemented as async Server Components are covered only by browser tests.

## Security and database suites

- `npm run test:security` runs `scripts/test-registration-profile.mjs` and `scripts/test-security.mjs`.
- `npm run test:payments` runs `scripts/test-payments-db.mjs` against an isolated in-memory MongoDB (`mongodb-memory-server-core`). It covers payment recording, rollback on failure and idempotent processing. It never touches a shared database.

The real Stripe webhook endpoint is `/api/payments/webhook`. Browser tests never call it; the database behaviour behind it is covered by `test:payments`.

## Browser tests (Playwright)

### Allowed targets

`E2E_BASE_URL` is required and validated by `playwright.config.ts` before any browser starts. It must be a bare origin (no path, query, fragment or credentials) and one of:

- a loopback production build: `http://127.0.0.1:3000`, `http://localhost:3000` or `http://[::1]:3000`;
- an HTTPS preview: `https://<name>.vercel.app` without a port.

Rejected: `asmm.ro`, `mimesiss.ro` and their subdomains, the production Vercel alias, and any other host. Do not run browser tests against `next dev`; development mode does not reflect production bundling, caching or headers.

There is no `webServer` entry. Start the target yourself.

### Projects

- `chromium` (Desktop Chrome, software WebGL through SwiftShader)
- `webkit` (Desktop Safari)
- `mobile-webkit` (iPhone 14)
- `authenticated` (Desktop Chrome, only when explicitly enabled, see below)

`api-boundaries.spec.ts` does not depend on the engine and runs only in `chromium`. Retries are disabled so flaky results surface as failures. Preview runs use one worker. Reports and traces are written to `.preview/test-suite/playwright-report` and `.preview/test-suite/test-results`.

### WebGL

The checkout flow contains no WebGL scene. Browser tests check only that pages remain usable when WebGL is disabled or unavailable. They do not verify real 3D rendering output and do not benchmark rendering or startup time.

### Optional authenticated tests

Disabled unless `E2E_AUTHENTICATED=1`. When enabled, every requirement below must hold or the run stops before a browser starts:

- the target is an `https://<name>.vercel.app` preview;
- `CLERK_PUBLISHABLE_KEY` starts with `pk_test_` and `CLERK_SECRET_KEY` starts with `sk_test_` (development instance only);
- `E2E_CLERK_USER_EMAIL` is a dedicated `+clerk_test` address belonging to an existing ordinary (non-admin) user with a completed MongoDB profile;
- in GitHub Actions, the run was started with `workflow_dispatch`.

These tests are read-only: sign-in, loading the dashboard, reading the signed-in user's own record through the owner-scoped user API, and confirming the admin area is denied. The provided workflow does not pass Clerk keys, so authenticated tests run only when someone supplies them deliberately.

## Not covered

The following need isolated fixtures (dedicated test users, an isolated database and Stripe test mode with webhook forwarding) and are not implemented:

- sign-up;
- congress or workshop registration submission;
- real Stripe payments: success, decline and abandonment;
- ticket delivery.

Also not covered: visual regression, CSS layout in jsdom, and WebGL rendering output.

## Performance budgets

Lighthouse CI runs separately with its existing budgets: LCP 2500 ms, TBT 200 ms, CLS 0.1. INP is a field metric and is not measured in lab runs. This test suite does not change those budgets and no measured score improvement is claimed. Vercel Analytics, Vercel Speed Insights and the `@next/third-parties` integration all remain in place.

## Commands

Install dependencies and browsers:

```bash
npm install
npx playwright install chromium webkit
```

On Linux, add `--with-deps` to install the system libraries the browsers need.

Run the Node-based suites:

```bash
npm run test:unit
npm run test:security
npm run test:payments
```

Run browser tests against a loopback production build:

```bash
npm run build
npm start
# in a second terminal
E2E_BASE_URL=http://127.0.0.1:3000 npm run test:e2e
```

PowerShell:

```powershell
$env:E2E_BASE_URL = 'http://127.0.0.1:3000'
npm run test:e2e
```

Run browser tests against a preview:

```bash
E2E_BASE_URL=https://<preview>.vercel.app npm run test:e2e -- --workers=1
```

In GitHub Actions, dispatch the Test suite workflow manually and enter the preview origin as `preview_url`.
