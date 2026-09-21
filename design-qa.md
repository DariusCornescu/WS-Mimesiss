# ASMM homepage design QA

Date: 2026-09-11

## Scope and reference

Selected visual: second image displayed in the design exploration (centered photographic hero, yellow ribbon, white navigation, MIMESISS feature).
Source visual truth: the second design exploration image retained in the project discussion.

Implementation: src/components/asociatie/AssociationHome.tsx and AssociationHeader.tsx, rendered directly in an isolated Next.js harness at http://127.0.0.1:3000. The production homepage passes getPublishedProjects() results to the same component. The isolated harness uses an empty project array to exercise the editorial fallback; it does not connect to production services.

Implementation screenshots: inline browser captures retained in this task's conversation ("Final visual comparison and image checks", "Check mobile homepage layout"). The browser API did not return local screenshot paths. Source and desktop implementation were emitted together in the same comparison call.
Desktop reference: 1435 x 1096 pixels. Desktop CSS viewport: 1435 x 1096; native viewport screenshots compared without stretching. Browser scrollbar occupies 15 CSS pixels. Mobile CSS viewport: 390 x 844; document scroll width measured 375 (no horizontal overflow).
State: homepage at top, mobile menu closed; expanded mobile navigation and keyboard dismissal also checked.

## Findings and comparison history

- Initial P2: hero text was approximately 76 px above the intended vertical placement. Added desktop-only vertical offset, then captured and compared again. Mobile retains centered content without that offset. Resolved.
- No remaining actionable P0/P1/P2 visual findings for the homepage.
- Intentional asset differences: the existing ASMM logo replaces the fictional mockup crest. Actual event photography replaces the invented building. Published congress cover/summary take precedence over fallback content.
- Existing congress, authentication, dashboard, payment, role, and edition logic are unchanged. Their original header remains in use outside the homepage.

## Required fidelity surfaces

- Typography: existing Inter font, bold two-line hero heading, large MIMESISS heading, readable body text; Romanian diacritics remain visible. Mobile wrapping inspected.
- Spacing: 86 px desktop header, 560 px hero, two-column congress feature and generous white space. Single-column mobile feature. Hero vertical rhythm corrected after comparison.
- Colors: white, navy #142641, yellow #ffd037, dark photo overlay; visible focus outlines. Tokens are scoped in a CSS module, leaving operational screens unchanged.
- Images: actual ASMM logo and event photographs, plus generated transparent ribbon asset. No broken images in browser check. Ribbon uses contain sizing to preserve proportions.
- Copy: selected hero and primary actions retained. Real project data remains wired into production. No fabricated dates or statistics added.

Full-view and focused review: side-by-side source/implementation output reviewed for overall structure; the separate 1265 px desktop capture and mobile capture made navigation, logo, heading, and button details legible without extra image crops.

## Verification

- TypeScript: node node_modules/typescript/bin/tsc --noEmit passed using package-lock.json versions installed with npm ci.
- ESLint: full repository check passed with 0 errors and 9 pre-existing warnings; changed components passed.
- Browser: hero action navigates to #proiecte; mobile menu opens; Tab then Escape closes it and restores focus to the toggle; no browser console errors in final checked state; no missing images or mobile horizontal overflow.
- Navigation destinations checked against existing source routes. The isolated homepage harness does not provide these destination routes (one exploratory /despre navigation returned harness 404). This is not a full-site preview.
- Live database, Clerk login, Stripe checkout, and a full production build remain unverified because this checkout has no .env.local configuration. No exports were imported or production data changed.

## Follow-up

Connect the existing service configuration and run integration checks before deployment. Visual approval of the homepage does not establish production readiness.

final result: passed

# Public page expansion QA

The selected option 2 design now covers /despre, /contact, /proiecte, project detail presentation, /congres, /congres/info, /congres/program, /congres/workshops, /congres/editii, /congres/gallery, /congres/reg and /congres/ghid. This supersedes the homepage-only scope and unavailable navigation notes above. Shared public navigation includes active links and congress subnavigation. Protected screens retain their existing implementation.

The isolated preview now renders the actual public presentation components and static pages, with one known congress fixture. Database-backed information and workshops show explicit preview notices. No prices, registrations or account behavior are simulated. Production server components retain the existing service calls.

Visual checks: desktop 1440 x 1000 and mobile 390 x 844. Every listed public navigation route loaded with a heading and no mobile horizontal overflow. Inline screenshots reviewed team, projects, contact, congress, information, workshops, archive, gallery, schedule and documents. Fixed the initially narrow single project card, clipped archive photo, hidden reveal content, and overly wide document text. Archive content is explicitly dated 2025.

Interaction checks: project navigation reaches congress. Gallery opens photographs, advances with ArrowRight, closes with Escape and restores focus to its opener. Earlier mobile menu keyboard checks remain applicable to the shared header.

Verification: TypeScript passed. Full repository ESLint reports zero errors and nine existing warnings. git diff --check passed. Browser logs contain two historical errors from the temporary preview layout encoding issue; UTF-8 was corrected and subsequent route renders succeeded.

Remaining limits: project detail and workshop data, account/admin screens, registration and Stripe payment require configured Clerk/MongoDB/Stripe services for integration verification. A production build and deployment were not performed. These checks establish public presentation readiness, not production service readiness.

Public presentation result: passed, with integration verification pending.

## Parteneri și sponsori — revizie 2026-09-21

Referință: captura furnizată de utilizator cu două rânduri de sigle, titluri mari centrate și fundal alb. Secțiunea ASMM folosește același ritm vizual, cu titlurile categoriilor alese pentru acest site și o mișcare continuă a siglelor instituționale, cerută anterior.

Verificare vizuală: desktop 1440 × 900 și mobil 390 × 844. Siglele reale din `public/orgs` se afișează integral, fără carduri sau decupare. Pe mobil, pagina nu are derulare orizontală (`scrollWidth` 375 la viewport 390). Controlul de pauză oprește animația și o poate reporni. A doua categorie rămâne fără sigle până la confirmarea sponsorilor și a asociațiilor partenere; niciun logo nu a fost atribuit unei categorii neverificate.

TypeScript `tsc --noEmit` și răspunsul local HTTP 200 au trecut. Verificarea se referă la prezentarea locală, nu la integrarea cu MongoDB sau la publicare.

final result: passed
