# Software Requirements Specification: Ironwood Resorts (headless hospitality platform)

| | |
|---|---|
| **Product** | Ironwood: a fault-tolerant guest website, booking flow and operations console on a headless (AEM-style) content contract |
| **Version** | 1.0 |
| **Status** | Baseline for review |
| **Companions** | `Solution-Deep-Dive.md` (design, contracts, wireframes), `SRS-Compliance.md` (evidence per requirement), `AEM_INTEGRATION.md`, `adr/` |

Keywords **MUST**, **SHOULD**, **MAY** follow RFC 2119. Priority **M**/**S**/**C** = must/should/could. Sources: **BR** business rule, **SEC** security, **UX** usability, **OPS** operations, **REL** reliability, **PERF** performance, **DEV** delivery.

---

## 1. Introduction

### 1.1 Purpose and scope
Define what Ironwood must do so that **guests** can discover, price and book a stay quickly and accessibly, **authors** can change marketing content without a code release, and **operators** can see bookings and site health, while the site **stays usable when its content service is degraded**.

In scope: the React web app, the Fastify API (persisted-query content delivery, availability, reservations, ops statistics, Web Vitals intake), the shared schema package, Universal Editor configuration, packaging, CI/CD and Terraform for AWS, and the Windows/Ubuntu/WSL2 developer workflows.
Out of scope: a real AEM tenant, payments, guest accounts and identity-provider integration, a production database, email, and any AI component (the design needs none).

### 1.2 Definitions
| Term | Meaning |
|---|---|
| Content fragment | A structured, authorable content item (hero, offer, room, venue) identified by a `/content/dam/…` path |
| Persisted query | A server-stored, named GraphQL query executed by `GET`, so it is cacheable and cannot be altered by the client |
| Matrix parameter | AEM-style `;name=value` suffix carrying query variables |
| Last-known-good (LKG) | The most recent successful content response, served (marked stale) when the upstream fails |
| Circuit breaker | Guard that stops calling a failing dependency for a cool-down period |
| Idempotency key | Client-chosen key that makes a booking retry safe |
| Universal Editor (UE) | Adobe's in-context editor, driven by `data-aue-*` attributes |
| Core Web Vitals | LCP, CLS, INP (plus FCP, TTFB) user-experience metrics |

### 1.3 References
`Solution-Deep-Dive.md`; RFC 2119; WCAG 2.1/2.2; Core Web Vitals thresholds; Adobe AEM GraphQL persisted queries and Universal Editor documentation; OWASP ASVS 4.0.

---

## 2. Overall description

### 2.1 Architecture in one line
`Browser (React, TanStack Query/Router, Zustand) -> CloudFront -> S3 (static) | ALB -> Fastify API (persisted queries + REST) -> content store / reservation store / vitals store`, with shared zod schemas in `@ironwood/shared` used on both sides.

### 2.2 User classes
| Class | Identity | Goal |
|---|---|---|
| Guest | anonymous | Find a suite, see an honest price, book without surprises |
| Author | `x-author-token` (demo) / AEM authentication (production) | Edit content in context and see it live |
| Operator | none in the reference (see §2.5) | See reservations, revenue, occupancy |
| Engineer | repository access | Ship safely, see site health, rehearse failure |

### 2.3 Operating environment
Evergreen browsers (ES2022); Node 22 (minimum 20.11); Linux containers (non-root); AWS (ECS Fargate, ALB, S3, CloudFront); development on Windows 11 (Docker), Ubuntu 24.04 or WSL2.

### 2.4 Constraints
C1 Content shape is a contract owned jointly: AEM owns fragments and queries, the frontend owns rendering and validates the contract. C2 No ad-hoc GraphQL from browsers in production. C3 No third-party runtime origins for scripts. C4 Money is integer cents. C5 Content failure must degrade, not blank, the page.

### 2.5 Clarifying assumptions (the questions to ask first)
These are **design targets, not measured results**.
| Question | Assumption used |
|---|---|
| Traffic | Read-heavy marketing traffic, bursts around campaigns; content cacheable at the edge for 30 s with 120 s stale-while-revalidate |
| Content change rate | Minutes to days; authors must not need a deploy |
| Inventory | Physical units per room type (40, 30, 12, 2); overbooking is a business failure, not a UX detail |
| Acceptable content outage | Site keeps selling using last-known-good content; pricing and availability stay live |
| Who sees the ops console | Internal staff behind corporate SSO at the edge. **The reference has no authentication on `/ops` or `/api/ops/*`** |
| Data durability | In-memory stores reset on restart. Production needs a database |

---

## 3. Specific requirements

### 3.1 Headless content delivery (FR-CNT)

| ID | Requirement | Pri | Source |
|---|---|:-:|:-:|
| FR-CNT-01 | Content MUST be served by persisted GET queries at `/graphql/execute.json/:project/:query;param=value`; the browser never sends query text. | M | BR |
| FR-CNT-02 | Matrix parameters (`;slug=x`) MUST be parsed into query variables. | M | BR |
| FR-CNT-03 | Responses MUST carry an `ETag` and `Cache-Control: public, max-age=30, stale-while-revalidate=120`; a matching `If-None-Match` MUST return 304. | M | PERF |
| FR-CNT-04 | Ad-hoc `POST /graphql` MUST be refused in production unless explicitly enabled. | M | SEC |
| FR-CNT-05 | An unknown persisted query MUST return 404. | M | BR |
| FR-CNT-06 | The frontend MUST validate every content response against the shared zod schema before rendering. | M | REL |
| FR-CNT-07 | On upstream failure the API MUST retry transient errors, open a circuit after 3 failures (10 s reset), serve last-known-good content marked `x-content-stale` with `no-store`, and return 503 only when nothing is cached. | M | REL |
| FR-CNT-08 | Authors MUST be able to edit a fragment field via `PATCH /api/content/:model/:id`; edits MUST validate against the model and be visible to later reads. | M | BR |

### 3.2 Universal Editor and authoring (FR-UE)

| ID | Requirement | Pri | Source |
|---|---|:-:|:-:|
| FR-UE-01 | Every authorable element MUST emit `data-aue-resource`, `-prop`, `-type`, `-label` (components also `-model`). | M | BR |
| FR-UE-02 | `ue/component-definition.json`, `component-models.json`, `component-filters.json` MUST exist, be valid JSON and mirror the shared content models. | S | DEV |
| FR-UE-03 | Built-in author mode (`?author=1`, never inside the editor iframe) MUST open an inline editor by mouse and keyboard, save, and persist. | S | UX |
| FR-UE-04 | When `VITE_AEM_AUTHOR_URL` is set the app MUST emit the `aemconnection` meta tag and load the editor CORS helper only when framed. | S | DEV |

### 3.3 Discovery and pricing (FR-STY)

| ID | Requirement | Pri | Source |
|---|---|:-:|:-:|
| FR-STY-01 | Stay search MUST live in typed URL search params; invalid input MUST degrade to defaults, not error. | M | UX |
| FR-STY-02 | A stay MUST be 1 to 30 nights and 1 to 8 guests, computed without month-boundary or timezone errors. | M | BR |
| FR-STY-03 | Content (GraphQL) and availability (REST) MUST load independently and be joined client-side by room id. | S | PERF |
| FR-STY-04 | A quote MUST show nights, nightly rate with weekend uplift, 13.5 % tax, $35 per night resort fee and a total, all in integer cents. | M | BR |
| FR-STY-05 | A room that cannot fit the party MUST be flagged unavailable with a reason. | M | BR |
| FR-STY-06 | Results MUST support *Available only* and sort by recommended, low or high price. | S | UX |
| FR-STY-07 | The Dining page MUST list venues with cuisine, price tier, hours and whether reservations are required. | S | UX |

### 3.4 Booking (FR-BKG)

| ID | Requirement | Pri | Source |
|---|---|:-:|:-:|
| FR-BKG-01 | `POST /api/reservations` MUST require an `Idempotency-Key`; a replay MUST return the stored result without a second booking. | M | REL |
| FR-BKG-02 | The server MUST refuse a reservation that would exceed physical inventory (penthouse: 2 units). | M | BR |
| FR-BKG-03 | The form MUST validate with the same shared schema as the server, show an error summary, and move focus to the first invalid field. | M | UX |
| FR-BKG-04 | Confirmation MUST show a reservation ID and move focus to its heading. | M | UX |
| FR-BKG-05 | The server MUST validate request bodies and query parameters and reject invalid input with a structured error. | M | SEC |
| FR-BKG-06 | A successful booking MUST invalidate cached ops statistics. | S | UX |
| FR-BKG-07 | The submit control MUST be disabled while pending or when the suite is unavailable. | S | UX |

### 3.5 Operations console (FR-OPS)

| ID | Requirement | Pri | Source |
|---|---|:-:|:-:|
| FR-OPS-01 | `/ops` MUST show active reservations, booked revenue, average daily rate and 14-day occupancy from `GET /api/ops/stats`. | M | BR |
| FR-OPS-02 | The reservations table MUST sort, filter and page on the server. | M | PERF |
| FR-OPS-03 | Sortable columns MUST be keyboard operable and expose `aria-sort`. | S | UX |
| FR-OPS-04 | The table and chart MUST load as separate lazy chunks fetched only on `/ops`. | S | PERF |
| FR-OPS-05 | A daily revenue and occupancy chart MUST be shown with a skeleton while loading. | S | UX |

### 3.6 Observability and resilience (FR-OBS)

| ID | Requirement | Pri | Source |
|---|---|:-:|:-:|
| FR-OBS-01 | The API MUST expose `/healthz` (liveness) and `/readyz` (readiness) and shut down gracefully on SIGTERM. | M | OPS |
| FR-OBS-02 | The app MUST report LCP, CLS, INP, FCP and TTFB to `/api/vitals` (including `sendBeacon` as `text/plain`); the API MUST summarise p75 and rate it against published thresholds. | M | PERF |
| FR-OBS-03 | Every API response MUST carry `x-request-id`. | S | OPS |
| FR-OBS-04 | Each data section MUST have its own Suspense skeleton and error boundary with retry, so one failure does not blank the page. | M | REL |
| FR-OBS-05 | Client queries MUST retry transient failures with exponential backoff (cap 8 s) and never retry 4xx. | S | REL |
| FR-OBS-06 | An authenticated control MUST let an operator set a chaos failure rate (0 to 1) and read breaker state. | S | OPS |
| FR-OBS-07 | Analytics MUST go through a vendor-neutral facade (GA4 and Adobe data-layer adapters), honour consent and isolate adapter failures. | S | BR |
| FR-OBS-08 | A stale-content banner MUST appear while content is served from last-known-good. | S | UX |

### 3.7 Security (FR-SEC)

| ID | Requirement | Pri | Source |
|---|---|:-:|:-:|
| FR-SEC-01 | Content writes MUST require the author token. | M | SEC |
| FR-SEC-02 | Configuration MUST be validated at boot; production MUST refuse the default author token. | M | SEC |
| FR-SEC-03 | The API MUST set security headers, restrict CORS to an allow-list, rate-limit (300 per minute) and cap bodies at 64 KB. | M | SEC |
| FR-SEC-04 | All input MUST be validated with zod at the boundary. | M | SEC |
| FR-SEC-05 | The web container MUST send CSP, `nosniff`, referrer policy and `frame-ancestors` limited to self and Adobe Experience Cloud. | S | SEC |
| FR-SEC-06 | The load balancer MUST forward only requests carrying the CloudFront-injected `X-Origin-Verify` secret. | S | SEC |
| FR-SEC-07 | Secrets MUST live in Secrets Manager; CI/CD MUST authenticate to AWS by OIDC with no long-lived keys. | S | SEC |
| FR-SEC-08 | The production web build MUST NOT embed an author token. | S | SEC |

### 3.8 Site UI and accessibility (FR-UI)

| ID | Requirement | Pri | Source |
|---|---|:-:|:-:|
| FR-UI-01 | Routes `/`, `/stay`, `/dining`, `/book`, `/ops`, `/showcase` MUST exist; unknown routes MUST show a not-found page and route errors a recoverable error page. | M | UX |
| FR-UI-02 | A skip link MUST be the first tab stop and move focus to `#main`. | M | UX |
| FR-UI-03 | On navigation the app MUST update the title, move focus to `<main>` and announce the page in a live region. | M | UX |
| FR-UI-04 | Home, Stay, Dining and Showcase MUST have no WCAG 2.1 A/AA axe violations in light and dark themes. | M | UX |
| FR-UI-05 | Light and dark themes MUST be offered, persisted, and applied before first paint. | S | UX |
| FR-UI-06 | Motion MUST be reduced when `prefers-reduced-motion` is set. | S | UX |
| FR-UI-07 | Layouts MUST work from 360 px wide with no sideways page scroll. | M | UX |
| FR-UI-08 | Interactive controls MUST have a minimum 44 px target. | S | UX |
| FR-UI-09 | Images MUST reserve intrinsic space; the LCP image MUST be eager with `fetchpriority=high`; others lazy. | M | PERF |
| FR-UI-10 | `/showcase` MUST present job-description traceability, Web Vitals, a resilience lab and authoring. | S | BR |

### 3.9 Non-functional requirements (NFR)

| ID | Requirement | Pri | Source |
|---|---|:-:|:-:|
| NFR-PERF-01 | Entry JS MUST stay at or under 90 kB gzipped and total JS at or under 260 kB, enforced by the build. | M | PERF |
| NFR-PERF-02 | Lighthouse CI MUST hold performance ≥ 0.9, accessibility ≥ 0.95, LCP ≤ 2.5 s, CLS ≤ 0.1. | M | PERF |
| NFR-PERF-03 | Routes MUST be code-split and loaders MUST prefetch without awaiting. | M | PERF |
| NFR-MNT-01 | TypeScript MUST be strict (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`); lint MUST pass with zero warnings. | M | DEV |
| NFR-MNT-02 | Unit and integration tests MUST run in every package; end-to-end tests MUST cover desktop and mobile. | M | DEV |
| NFR-DEV-01 | CI MUST run format, lint, typecheck, tests, build, e2e, Lighthouse, image scan and Terraform checks, gated by one required check `ci-ok (required check)`. | M | DEV |
| NFR-DEV-02 | Images MUST be multi-stage, run as non-root, and define a health check. | M | SEC |
| NFR-DEV-03 | Infrastructure MUST be Terraform with dev and prod environments, S3 state with lockfile, and fmt/validate/tfsec in CI. | M | DEV |
| NFR-DEV-04 | Deploys MUST roll ECS with circuit-breaker rollback, sync the web build to S3 and invalidate CloudFront. | M | DEV |
| NFR-DEV-05 | The project MUST build on Windows 11, Ubuntu and WSL2 with Node 20.11 or newer. | S | DEV |
| NFR-DEV-06 | CI MUST NOT depend on dependency bots or external uploads: no automated dependency-update pull requests, Lighthouse results not uploaded, vulnerability scan report-only, code scanning only where the platform supports it, deploy inert until AWS is configured. | S | DEV |
| NFR-DOC-01 | Architectural decisions MUST be recorded as ADRs and the job-description mapping kept in `docs/`. | S | DEV |

---

## 4. External interfaces

### 4.1 API (JSON; errors `{ "error", "message", ... }`)
| Method and path | Purpose | Access |
|---|---|---|
| `GET /graphql/execute.json/:project/:query;p=v` | Persisted query (`home-hero`, `offers-list`, `rooms-list`, `venues-list`); 200 with ETag, 304, 404, 503 | public |
| `POST /graphql` | Ad-hoc query (development only) | dev only |
| `PATCH /api/content/:model/:id` | Edit a fragment field; model-validated | `x-author-token` |
| `GET /api/availability` | Availability and quote per room for a stay | public |
| `POST /api/reservations` (`Idempotency-Key`) | Create a reservation; 409 on overbooking | public |
| `GET /api/reservations` | Server-side sort, filter, page | operator (unauthenticated in reference) |
| `GET /api/ops/stats` | Totals and 14-day series | operator (unauthenticated in reference) |
| `POST /api/vitals`, `GET /api/vitals/summary` | Web Vitals intake (JSON or `text/plain` beacon), p75 summary | public / operator |
| `GET /api/resilience`, `POST /api/resilience/chaos` | Breaker state; set failure rate | public read / `x-author-token` |
| `GET /healthz`, `GET /readyz` | Liveness, readiness | none |

Headers: `ETag`, `Cache-Control`, `x-content-stale`, `x-request-id`, `Idempotency-Key`, `x-author-token`.

### 4.2 Content models (source: `packages/shared/src/content.ts`; mirrored in `ue/component-models.json`)
`hero`, `offer`, `room`, `venue`; every fragment has `_id` and a `_path` starting `/content/dam/`; every image has `_path`, `width`, `height`, `alt` (1 to 200 characters).

### 4.3 Universal Editor instrumentation
Text: `data-aue-resource`, `data-aue-prop`, `data-aue-type` (`text`|`richtext`), `data-aue-label`. Components add `data-aue-model`. Resource URN from `ueResource(_path)`.

### 4.4 Vitals
`LCP`, `CLS`, `INP`, `FCP`, `TTFB`, each rated *good / needs-improvement / poor* by published thresholds.

---

## 5. Data requirements
| Data | Where | Notes |
|---|---|---|
| Content fragments | API in-memory store (seeded) | authoring edits held until restart; AEM is the system of record in production |
| Reservations, idempotency records | API in-memory store | lost on restart; production needs a database with a unique constraint on the idempotency key |
| Vitals samples | API in-memory ring | summary only; production needs a metrics backend |
| Booking draft, theme, author mode, resilience flag | Browser (Zustand; theme persisted in `localStorage`) | no personal data persisted |
| Secrets | AWS Secrets Manager | never in images or the web bundle |

Production mapping: PostgreSQL for reservations (unique on idempotency key, inventory checked in the same transaction), AEM Publish as content origin, CloudWatch/OpenTelemetry for vitals. **Not built here.**

---

## 6. Verification approach
**T** automated test (Vitest, Testing Library, vitest-axe, Fastify inject) · **A** static analysis (`tsc --strict`, ESLint with a11y and hooks rules, Prettier) · **B** build-time budget check · **E** Playwright end-to-end with axe · **CI** executed by GitHub Actions · **M** manual or external (screen reader, real devices, load, AWS apply).

## Appendix A: Access matrix (mirrors the code)
| Capability | Guest | Author | Operator | Engineer |
|---|:-:|:-:|:-:|:-:|
| Read content, availability, vitals intake | X | X | X | X |
| Create a reservation | X | X | X | X |
| Edit a content fragment | | X | | |
| Set chaos rate | | X | | X |
| View `/ops`, reservations list, vitals summary | | | X | X |
