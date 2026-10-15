# Project story performance — 16 October 2026

## Scope and changes

- MIMESISS: generate the unchanged neuron geometry in a dedicated worker and transfer its buffers; prepare textures concurrently; share identical body geometry; freeze static object transforms; skip identical scene renders; cancel and dispose loading work on navigation.
- Mobile MIMESISS textures use responsive image delivery (828 px photographs, 640 px membrane, quality 85). The introduction logo and full-resolution photo viewer remain unchanged.
- Bal and Cort: mount the opening and next frame initially, prepare later frames as the reader approaches them, keep only visible frames promoted for animation, and stop repainting the decorative lighting gradient on phones.
- Render the event stories in their initial animated layout on the server, eliminating the static-to-animated layout jump. Retain reduced-motion and no-JavaScript presentations. Load the opening blurred backdrop eagerly after measurements identified it as a late LCP candidate.
- Use the existing small favicon instead of requesting the 1.7 MB SVG. Optimize the below-fold workshop collage through responsive delivery.
- Resolve both application and Next.js image processing to the existing Sharp 0.35.5 version. On Windows, simultaneous native runtimes previously emitted GLib errors and returned large originals instead of thumbnails. A regression test exercises both processing paths together.

## Comparable local production measurements

Three mobile Lighthouse 12.6.1 runs per route; medians below. Baseline source: 3309ccc. MIMESISS result: dd9fff9. Event and common-page results: 6f5f129 (the additional change only makes the opening event backdrop eager).

Both versions use Next.js 16.0.9 production webpack builds on the same Windows host, Chrome 155, temporary isolated MongoDB 7.0.24 instances, and matching environment settings. Baseline: localhost:3104; optimized: localhost:3105. Both use the unified Sharp runtime so the comparison measures page changes under working image delivery, rather than counting the local native-runtime failure as a production improvement. Initial discarded runs with broken image delivery are excluded.

Profile: 412 × 823 CSS px, DPR 1.75; DevTools throttling, 4× CPU slowdown, 562.5 ms request latency, 1474.56 Kbps download and 675 Kbps upload. Browser navigation storage/cache is reset per Lighthouse run; server image caches are retained. These are lab measurements, not physical-phone frame-rate or real-user INP measurements.

| Route | LCP ms, before → after | TBT ms, before → after | CLS, before → after | Transfer MB, before → after |
| --- | ---: | ---: | ---: | ---: |
| /proiecte | 3798 → 3829 | 3061 → 1092 | 0.000 → 0.000 | 4.27 → 1.81 |
| /proiecte/balul-bobocilor | 7856 → 3883 | 799 → 701 | 0.209 → 0.000 | 2.85 → 1.08 |
| /proiecte/cortul-imm | 8115 → 3771 | 916 → 535 | 0.169 → 0.000 | 3.01 → 1.14 |

Raw local reports: .lighthouseci/render-valid-before and .lighthouseci/render-final-after in the audit workspace. MIMESISS results are retained from the completed three-run comparison; subsequent event-only changes were remeasured on the affected routes.

## Common-route release audit

Three runs per route with the same final production build and profile. These establish final values; no before/after claim is made for these routes.

| Route | LCP ms | TBT ms | CLS | Transfer MB |
| --- | ---: | ---: | ---: | ---: |
| / | 4123 | 1087 | 0.006 | 0.99 |
| /despre | 3862 | 1067 | 0.000 | 1.09 |
| /contact | 3929 | 733 | 0.000 | 0.96 |
| /congres | 4104 | 1005 | 0.000 | 0.97 |

## Public baseline, separate environment

The following pre-change measurements came from https://asmm.ro on 16 October 2026, three mobile runs per route. Hosting, settings and image delivery differ from the isolated local environment. Do not calculate improvement percentages by comparing this table with the local results.

| Route | LCP ms | TBT ms | CLS |
| --- | ---: | ---: | ---: |
| /proiecte | 2982 | 1583 | 0.000 |
| /proiecte/balul-bobocilor | 5092 | 687 | 0.209 |
| /proiecte/cortul-imm | 5621 | 811 | 0.169 |

## Correctness and remaining work

- Production build and TypeScript checks passed. ESLint: zero errors and nine existing warnings outside these changes.
- Three story tests passed, including the shared native-image regression test. The ASMM 384 px AVIF endpoint returned 6,512 bytes, rather than the 388 KB original.
- Checked mobile chapter navigation for all three stories, MIMESISS logo-to-photo transition, direct navigation to the final neuron, and opening/closing the full photo viewer. Verified no horizontal overflow at 390 × 844. Checked the desktop scene and the hosted preview's worker-backed scene.
- Unauthenticated admin API checks returned 401; dashboard redirected with 307; login returned 200. Authorization, database caching, payment and registration logic are unchanged. No real payment was made and no signed-in end-to-end purchase was performed in this audit.
- Physical Android/iOS touch behavior, Safari, reduced-motion interaction and the no-JavaScript presentation were not manually exercised in this pass. Their fallback paths remain in the source. Field p75 LCP/INP/CLS data is unavailable for this revision.
- Budgets remain LCP ≤ 2500 ms, TBT ≤ 200 ms and CLS ≤ 0.1. Record failures as open performance work; this report is not an all-budgets-pass claim. The project-story changes reduce load and blocking, while shared client initialization, analytics, authentication scripts and image response latency still require follow-up profiling. Owner: ASMM site maintenance; review date: 23 October 2026. No budget was relaxed.
