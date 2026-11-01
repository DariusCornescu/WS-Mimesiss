# ASMM performance standard

## Release checks

Run lint, typecheck, production build and critical journey tests. Measure the
public homepage, association, projects, contact and congress pages with the
root `lighthouserc.cjs` configuration. Install `@lhci/cli` as development tooling
in the environment running the audit, then run `lhci autorun` from the repository
root. Chrome must be available. Reports remain local in `.lighthouseci/reports`.
Set `PERFORMANCE_BASE_URL` to an isolated production preview URL to test changes
before deployment; the default is https://asmm.ro. Never benchmark `next dev`.

The audit takes three mobile runs per route and fails on median LCP above
2500 ms, CLS above 0.1, or total blocking time above 200 ms. These are initial
project lab budgets, not a measured baseline. Record the initial failures;
do not relax a budget silently. Record exceptions with an owner and review date.

Existing Speed Insights provides real-user measurements. Require LCP <= 2.5 s,
INP <= 200 ms and CLS <= 0.1 at the 75th percentile, separately for mobile and
desktop. Lighthouse total blocking time is a diagnostic proxy, not INP. Report
insufficient field data as unavailable. Also manually check desktop and signed-in
registration, payment and ticket journeys; public page audits cannot cover them.

## Implementation rules

- Prefer server components; isolate interactive client code. Profile expensive
  rendering before introducing memoization or extra dependencies.
- Use responsive image sizes, reserved dimensions and below-fold lazy loading.
  Load the main visible image promptly. Skeletons must preserve layout.
- Select only required database fields. Paginate growing lists with server-side
  limits. Avoid per-item queries and inspect query plans before adding indexes.
- Reuse the existing MongoDB pool. Account for total pools across deployed instances.
- Settings already have request deduplication and a five-minute shared cache with
  tag invalidation. Maintain invalidation on writes. Purchase and registration
  decisions must observe authoritative settings and capacity.
- Keep roles, personal data and ticket status out of shared public caches. Every
  new cache needs a documented key, scope, expiry, invalidation and failure behavior.
- Verify platform compression and asset delivery before adding infrastructure.
  Add a CDN, shared cache or load balancer only for a measured need.
- Each optimization must record route, bottleneck, baseline, change, result and
  correctness checks under consistent test conditions.

## References

- https://web.dev/articles/vitals
- https://nextjs.org/docs/app/guides/production-checklist
- https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
