# Neural story startup validation

The MIMESISS story renders its intro copy and a responsive WebP frame before
initializing WebGL. The frame is captured from the existing scene: 85,810 bytes
on desktop and 17,568 bytes on portrait phones. Original source textures remain
available at their existing quality.

After the first paint, the scene module is imported when the stage approaches
the viewport. A worker builds the first neuron separately from the background
and subsequent neurons, including precomputed bounds. Abortable image fetches
use ImageBitmap decoding where supported and an HTML image fallback otherwise.

The first two photographs are prepared for the opening composition. The next
photograph is requested after progress 0.15 and the final photograph after 0.45,
ahead of their camera arrivals. Fast scrolling prioritizes the destination and
its connecting neighbour. The current frame is retained until the required
photographs are ready. Leaving the story aborts image requests, terminates the
worker and disposes geometry, textures, decoded bitmaps and the renderer.

## Local production audit, 16–17 October 2026

Three mobile Lighthouse runs of `/proiecte` before and three after the final
implementation used the performance preset, the same localhost production
server configuration, an ephemeral database and matching test authentication
keys. No production data, accounts or payments were changed.

| Median | Before | After |
| --- | ---: | ---: |
| Performance score | 42 | 44 |
| LCP | 4,676 ms | 4,351 ms |
| TBT | 1,915 ms | 3,684 ms |
| CLS | 0 | 0 |
| Total transferred bytes | 1,255,609 | 1,283,494 |
| CPU benchmark index | 3,400.5 | 1,750 |

**This is not evidence of a stable performance gain.** TBT was worse, while the
CPU calibration also changed materially. The 85+ target and the existing
2,500 ms LCP / 200 ms TBT budgets are not met. Do not treat the two-point score
change as an improvement attributable to this implementation. A stable hosted
audit is required before release; preview access protection remains enabled.
The earlier iteration that loaded every chapter immediately was rejected and
its measurements are retained separately from the final results.

All three final startup traces request the mobile frame and only the first two
scene photographs; the last two scene photographs are absent until scrolling.
The added opening frame increases total startup traffic slightly while making
the composition independent of WebGL readiness.

## Correctness checks

- Production build, TypeScript and lint pass without errors. Nine existing
  source warnings remain; local preview helpers add two unrelated warnings.
- 28 tests pass: 23 story/gallery/editor/loading tests and five public startup,
  session and analytics tests.
- At 384 × 824 and 1280 × 720, verify upright photographs, initial composition,
  chapter changes, fast scrolling to the final chapter and returning to the logo.
- Delaying the logo texture by 25 seconds keeps the heading and opening frame
  visible before a WebGL canvas exists; the interactive scene takes over later.
- Switching projects during that delay leaves no canvas or console error.
- Anonymous session responses remain private and uncached; Dashboard/Admin
  redirect and the administrative API returns 401. Signed-in payment and account
  journeys require their separate release verification.

Raw reports, the revised iteration, request lists and screenshots are retained
locally under `output/scene-startup-2026-10-16/`. Browser checks do not establish
scroll FPS, field INP or results for the public production domain.

## Optimization sequence, 17 October 2026

Keep Google Analytics, Vercel Analytics and Speed Insights. Retain the animated
stories, editable project copy, image quality and protected account flows.
Do not postpone work merely beyond an audit window or detect audit clients.

1. Establish a trustworthy reference. Run five interleaved mobile audits of a
   frozen reference and the candidate on one isolated runner. Compare content
   alone, content plus Analytics, content plus 3D and the complete page. Reject
   authentication redirects and incomplete series; investigate CPU variation.
   Keep the raw traces and source revisions. Diagnostic build flags cannot run
   on production Vercel deployments.
2. Reduce application work. Informational GET/HEAD navigation now avoids the
   authentication handshake. Personalized workshop pages, mutations, session,
   account and admin routes retain authentication. Project composition and copy
   now render on the server, while scroll and gallery controls remain interactive.
   Below-fold project gallery images are lazy; the separate congress gallery
   keeps its first visible image prioritized. Measure this change against the
   frozen reference before attributing any score gain to it.
3. Address the largest remaining trace costs individually. Inspect application
   hydration, Analytics execution and renderer initialization separately. If 3D
   initialization remains a large main-thread task, prototype rendering in a
   worker using OffscreenCanvas with a compatible fallback, then compare first
   scroll, rapid chapter changes and navigation cleanup. The current geometry
   worker does not move the renderer itself off the main thread.
4. Validate Analytics changes against actual reporting needs. All three services
   stay enabled. A worker-based Analytics prototype must verify initial page
   views, client navigation, original referrer, engagement and page exit; it is
   not accepted if it loses data. Further idle delays are not an optimization
   of the underlying execution cost.
5. Re-audit the other public routes using the project's `lighthouserc.cjs` against
   a production build. Prioritize each route's measured LCP asset, script or
   server bottleneck. Preserve responsive image dimensions, authoritative
   registration/payment checks and settings cache invalidation.
6. Release only after median score >=85, LCP <=2500 ms, TBT <=200 ms and
   CLS <=0.1, plus mobile/desktop visual and signed-in journey checks. Follow
   Speed Insights at the 75th percentile for mobile and desktop separately;
   lab TBT does not establish field INP. Use bounded preview load tests with
   explicit concurrency, duration, error-rate and latency stop conditions.

The first local diagnostic series contains five runs per variant:

| Variant | Median score | LCP | TBT | Transferred JavaScript |
| --- | ---: | ---: | ---: | ---: |
| Content without Analytics or 3D | 88 | 2,386 ms | 295 ms | 169,423 bytes |
| Content plus Analytics | 71 | 2,422 ms | 1,209 ms | 353,721 bytes |
| Content plus 3D | 65 | 2,886 ms | 956 ms | 313,980 bytes |
| Complete page | 69 | 2,438 ms | 1,405 ms | 498,307 bytes |

These are diagnostic controls, not proposed release configurations. CPU index
spread was 36.2%, so they do not prove exact causal improvements. A subsequent
local before/after rendering comparison was stopped: TBT spiked in the unchanged
reference as well. Its partial results are explicitly rejected for comparison.
The isolated runner includes reference commit
`04b39f2a6ff26c8851b5ba499ee3f534a957a9e5` to avoid that local confounder.

Local audits use an ephemeral MongoDB and fictitious CI provider keys. Analytics
collection endpoints are blocked while the script executes; Vercel collection
scripts may be unavailable on localhost. These tests do not validate provider
accounts or deployed collection. No production settings or data are changed.

Correctness checks for the rendering change: 32 unit checks pass, production
build, TypeScript and lint pass, and browser verification at 384 x 824 and
1280 x 720 preserves the stories. Gallery selection opens the correct image;
next, zoom and close work. The opening scene loads photos 0 and 1, then prepares
later photographs as scrolling progresses. No browser console errors were
observed in that verification. The 85+ target remains unproven.

Implementation references:
- https://nextjs.org/docs/app/getting-started/server-and-client-components
- https://web.dev/articles/optimize-long-tasks
- https://threejs.org/manual/pages/offscreencanvas.html
