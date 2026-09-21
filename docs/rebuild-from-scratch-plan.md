# ASMM / MIMESISS rebuild plan

Draft: 21 September 2026. This is a plan for a new implementation of the current association site and congress system, preserving confirmed content and historical data. The current repository remains a reference until the replacement passes acceptance checks.

## What we know and must verify

- The current application is Next.js/TypeScript with Clerk, MongoDB, Stripe, an admin panel, user dashboard, workshop registration, tickets and QR attendance.
- The public redesign has ASMM pages, the MIMESISS congress, a gallery and an institutional-logo strip. Several public pages still contain fixed 2025 content.
- A previous restore reported 1,215 documents in `mimesiss_test` (including 272 users and 771 registrations). A previous production Clerk import reported 272 accounts with the old user ID stored as `externalId`. These are historical command results, not a fresh audit.
- The production Clerk IDs have **not** yet been linked to all MongoDB references. Do not import the users again or point the new production app at `mimesiss_test`.
- MongoDB access from the current local environment is intermittent. Verify network/database access before treating any data-backed feature as complete.
- The sponsor/association list, updated board, photo permissions, new domain and final registration/payment rules need confirmation from ASMM.

## Recommended architecture

Keep a small, familiar stack: Next.js + TypeScript for the website and admin panel, Clerk for sign-in, MongoDB Atlas for application data, and Cloudflare R2 for photos. Use Stripe only if the next edition sells tickets online. Vercel is the simplest deployment path for the existing Next.js app. Keep development, staging and production secrets and databases separate.

Use a new repository or isolated app directory for the rebuild. The current app and the restored backup are read-only references during implementation. Build shared design tokens from the ASMM burgundy/ivory identity, with separate public and admin layouts. Put all editable content behind an admin workflow; avoid changing source code for each new edition or sponsor.

Proposed data structure:

`Project → Edition → Session (workshop/conference) → Album → Photo`

Other records: `BoardMember`, `Partner` (type: institutional / association / sponsor), `User`, `Registration`, `Ticket`, `Payment`, `Attendance`, and `SiteSettings`. MongoDB stores photo metadata; R2 stores the image files. Keep role checks on the server for every admin action.

## Delivery stages

| Stage | Build | Exit check |
| --- | --- | --- |
| 0. Inventory and decisions | List every current route, admin action, data collection, export, asset and external account. Confirm which features are required for the first launch. | Signed-off page/feature list and data-migration map. |
| 1. Foundation | New app, design system, public/admin layouts, staging environment, error handling, logging, CI and separate service credentials. | Staging deploy works; public and admin boundaries are tested. |
| 2. Public site | Home, about/board, projects, MIMESISS editions/program/workshops, gallery and contact. Make the sponsor/partner rows and board editable. Preserve old URLs with redirects. | Content owner approves desktop and mobile pages; navigation and accessibility checks pass. |
| 3. Content admin | CRUD and publish/draft for projects, editions, workshops, board, partners and photo albums; ordering and preview. Photo upload validates format/size and creates optimized display versions. | An admin can publish a new edition and album without code changes. |
| 4. Event operations | Clerk account linkage, registration with capacity protection, participant dashboard, tickets/Stripe if retained, QR scan and attendance, role-aware reports. | End-to-end staging rehearsal with user, moderator and admin accounts; payment/webhook and concurrent registration tests pass. |
| 5. Migration and launch | Rehearse against a copy of the backup, verify counts and relationships, perform final backup, switch domain/DNS/Clerk/Stripe configuration, monitor and retain rollback path. | All migration checks pass and a production smoke test succeeds before announcing the new site. |

Stages 2–3 give ASMM a useful public site and content panel before the higher-risk event workflows are moved. If registration or payment is required on day one, stage 4 becomes a launch prerequisite.

## Migration procedure

1. Export a fresh, dated backup and record document counts and schema examples. Never modify the only copy.
2. Recheck the production Clerk instance and build a one-to-one map from each old ID (`externalId`) to its production Clerk ID. Reconcile all 272 previously reported users; investigate missing/duplicate entries before writes.
3. Restore the historical data into a **new staging database**. Run idempotent migrations to map user IDs in users, registrations, payments, issued tickets and attendance audit fields. Preserve each original ID for audit/rollback.
4. Migrate projects and workshops into explicit editions. Mark historical 2025 content as archived; do not invent a current program or sponsor list.
5. Run dry-run and then apply migrations in staging. Compare collection counts, unique indexes, orphan references, ownership, roles, registrations, payment amounts/statuses and a sample of real user histories.
6. Repeat with a fresh production backup only after the staging rehearsal passes. Record the migration version and a rollback procedure before changing DNS.

Clerk documents `externalId` as a migration bridge. Because the current application uses native Clerk IDs throughout its database, the proposed rebuild maps the database references to the new native IDs rather than relying on email matching alone. [Clerk migration guide](https://clerk.com/docs/guides/development/migrating/overview)

## Photos, security and operations

- Upload from an authenticated admin/moderator workflow with server-side size/type validation and authorization. Keep originals and optimized versions; store captions, order, photographer/source and publication status in MongoDB. Publish only photos cleared by ASMM for public use.
- R2 Standard is a reasonable starting point; its bill depends on GB-months stored plus write/read operations. Review its current limits before enabling bulk uploads. [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- Keep Stripe webhook signature verification and duplicate-event protection if payments are retained. Reconcile each successful payment to one ticket/registration. [Stripe webhook guide](https://docs.stripe.com/webhooks)
- Set up database and photo backups, two organization-controlled administrators for each service, secret rotation, and a simple incident/restore checklist.
- Domain-based email is a separate workstream after the domain is chosen. It does not block the public site build, but the domain and DNS are needed for production authentication and launch.

## Launch dependencies and rollback

The new domain must be owned by ASMM and its DNS editable by at least two board members. A production Clerk domain change needs new DNS records and a new publishable key, followed by redeployment; plan this as a coordinated cutover, not a casual configuration edit. [Clerk domain-change guide](https://clerk.com/docs/guides/development/deployment/changing-domains)

Deploy to staging first. Keep the old site available until the new domain resolves, Clerk login works, public content loads, admin permissions hold, and (if used) Stripe webhooks complete a test transaction. Keep the previous deployment and backup available for rollback. Redirect old public URLs and check them after cutover.

## Inputs needed from ASMM

1. Which first-launch features are mandatory: public pages only, or also registrations, payments and QR attendance?
2. Confirmed board names, roles, portraits and permission to publish them.
3. Confirmed institutional partners, association partners and sponsors, with original logos and preferred links.
4. Photos to import, grouped by project/edition/workshop, and who can approve publication.
5. Domain choice, organization-controlled access to DNS/Vercel/Clerk/MongoDB/Stripe/R2, and the person responsible for final content approval.

## Rough sequence

For one developer with timely access and content: allow roughly 2–3 weeks for stages 0–2, another 1–2 weeks for the content panel and photo albums, and another 2–4 weeks for event operations, migration rehearsal and launch. This is a planning range, not a commitment; the first inventory stage sets the actual estimate. Do not switch the live domain until the required launch path has passed staging.
