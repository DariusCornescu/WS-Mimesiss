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
