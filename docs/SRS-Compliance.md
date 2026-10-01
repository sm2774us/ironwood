# SRS Compliance Report: Ironwood Resorts

| | |
|---|---|
| **Subject** | Shared schemas, Fastify API, React web app, UE configuration, container files, CI/CD and Terraform |
| **Measured against** | `docs/SRS.md` v1.0 (69 requirements) |
| **Method** | Requirement-by-requirement review against the code, plus the automated results from the authoring environment |
| **Not verified** | Docker image builds, GitHub Actions runs, `terraform validate`/`apply`, AWS, AEM, a screen reader, Windows or WSL, load (see §5) |

## 1. Executive summary

* **The server-side guarantees are verified by tests:** persisted-query contract (matrix params, ETag/304, 404, production block on ad-hoc GraphQL), last-known-good fallback with the stale marker, circuit-breaker open and half-open, retry only on transient errors, idempotent reservations, overbooking refusal, server-side sort/filter/paging, pricing with weekend uplift, tax and fees, content-model validation on edits, beacon intake and p75 rating.
* **The front end is verified at component level** (Universal Editor attributes, inline editor by mouse and keyboard, axe on the editable component, LCP and layout-shift image behaviour, URL-state parsing, analytics consent and isolation). **Pages are not individually tested**; most page behaviour is implemented and type-checked but unobserved, so it is rated 🟡.
* **Playwright end-to-end and page-level axe specs were run for real** (26 passing on desktop and Pixel 7) in a bundled Chromium 131, including 16 axe scans across both themes. Lighthouse budgets were also run locally and pass with wide margins.
* **Docker, `terraform validate`, GitHub Actions and AWS were not exercised.** Docker build stages were simulated step by step, nginx was run for real, Terraform was formatted, scanned with tfsec and statically cross-checked, workflows pass `actionlint`; no image was built and nothing was planned or applied.
* **Testing found and fixed real defects:** nginx per-location `add_header` silently dropped the CSP and other security headers, an inline theme script would have been blocked by that CSP, and a skip-link test raced the SPA mount.
* **The operations console and its API routes have no authentication** in the reference (SRS §2.5). That is a deliberate scope limit, stated openly, not a hidden flaw; it must be closed before any real deployment.

### Tally
| Status | Count |
|---|---:|
| ✅ Met | 35 |
| 🟡 Met in code, unverified here | 34 |
| 🟠 Partially met | 0 |
| ❌ Not met | 0 |
| **Total** | **69** |

**Legend.** ✅ implemented and covered by a check that ran green here · 🟡 implemented; needs a browser, Docker, CI run, AWS or human review, or has no direct test · 🟠 partially met, gap stated · ❌ not met.

### Evidence that ran green
| Check | Result |
|---|---|
| `tsc --noEmit` (shared, api, web) | 0 errors |
| ESLint (typescript-eslint, react-hooks, jsx-a11y), `--max-warnings 0` | 0 issues |
| Prettier `--check` | clean |
| Vitest: shared | **7 passing** |
| Vitest: API (Fastify inject) | **21 passing** |
| Vitest: web (jsdom, Testing Library, vitest-axe) | **13 passing** in 5 files |
| API bundle (`tsup`) | builds |
| Web production build and bundle budget | entry **42.2 kB** gz (budget 90), total JS **202.8 kB** gz (budget 260) |
| `npm run verify` (all of the above, end to end) | exit 0 |
| Playwright (Chromium 131): 13 specs × desktop and Pixel 7, incl. 16 axe scans (4 pages × light/dark) | **26 passed** |
| Lighthouse (desktop preset): `/`, `/stay`, `/dining` | performance 1.0, accessibility ≥ 0.98, LCP ≤ 0.64 s, CLS ≤ 0.009; assertions pass |
| Real nginx 1.24 with the shipped template; real-browser pass of 5 pages with CSP enforced | headers on every route; 0 console errors, 0 CSP violations |
| Docker build stages simulated without Docker; API booted in production mode | `/readyz` 200, persisted query 200; web image context builds within budget |
| `actionlint` on all workflows; `hadolint` on both Dockerfiles | clean |
| `tofu fmt -check`; `tfsec` v1.28.11 | clean; 0 findings with documented exclusions |
| Workflow YAML and `protect-main.json`, UE JSON files | parse |

## 2. Traceability to the request
| Requirement in the brief | Delivered | Status |
|---|---|---|
| React 18.3.1 and TypeScript ^5.6.3 frontend, TypeScript backend | `apps/web`, `apps/api`, `packages/shared` | ✅ |
| AEM headless GraphQL with persisted queries | GET persisted queries with ETag/SWR, matrix params, production block on ad-hoc | ✅ |
| Universal Editor (`data-aue-*`) | Attributes, `ue/*.json`, built-in author mode | ✅ / 🟡 |
| Performance, LCP, code splitting | Preload, priority image, chunks, budget gate; Lighthouse budgets pass locally | ✅ |
| Accessibility (WCAG) | Radix primitives, skip link, focus management; axe passes at component level and on 4 pages × 2 themes × 2 viewports | ✅ / 🟡 |
| State management | Query, Router search params, Zustand (ADR 0002) | ✅ |
| Tailwind, component library | Tailwind tokens, shadcn-style owned components | ✅ |
| Jest/RTL/Playwright | Vitest (Jest API) + RTL; Playwright 26 passing | ✅ |
| GitHub Actions CI/CD | `ci.yml`, `codeql.yml`, `deploy.yml`, ruleset; no dependency-bot pull requests | 🟡 |
| Terraform like the reference | Modules and dev/prod envs for AWS | 🟡 |
| Monorepo tooling (nice to have) | npm workspaces + Turborepo | ✅ |
| Micro-frontends (nice to have) | Designed, deliberately deferred (ADR 0005) | 🟠 |
| Analytics (nice to have) | GA4 and Adobe data-layer facade with consent | ✅ |

## 3. Requirement-level compliance

### 3.1 Headless content delivery (FR-CNT)

| ID | Status | Evidence or gap |
|---|:-:|---|
| FR-CNT-01 | ✅ | API test *serves rooms with cache headers and ETag revalidation*; Lighthouse and Playwright runs exercise the GET endpoints end to end |
| FR-CNT-02 | ✅ | API test *passes AEM-style matrix params as variables* |
| FR-CNT-03 | ✅ | API test *serves rooms with cache headers and ETag revalidation* |
| FR-CNT-04 | ✅ | API tests *404s unknown persisted queries and blocks ad-hoc GraphQL in production*, *allows ad-hoc GraphQL outside production* |
| FR-CNT-05 | ✅ | API test *404s unknown persisted queries…* |
| FR-CNT-06 | 🟡 | Implemented in `features/content/queries.ts`; schema behaviour tested (*rejects hero fragments outside /content/dam*, API *rejects edits that violate the content model*); the query-layer parse itself has no direct test |
| FR-CNT-07 | ✅ | API tests *serves last-known-good content (marked stale)…*, *returns 503 when the upstream fails and nothing is cached*, *opens after repeated failures and half-opens…*, *retries transient errors only* |
| FR-CNT-08 | ✅ | API tests *edits a fragment and is visible to subsequent reads*, *rejects edits that violate the content model* |

### 3.2 Universal Editor and authoring (FR-UE)

| ID | Status | Evidence or gap |
|---|:-:|---|
| FR-UE-01 | ✅ | Web test *emits Universal Editor data attributes for in-context editing*; shared test *builds a Universal Editor resource URN* |
| FR-UE-02 | 🟡 | Files parse as JSON (checked); field-by-field parity with the zod schemas is by review, not by test |
| FR-UE-03 | ✅ | Web test *opens the inline editor in author mode (mouse and keyboard)*; Playwright `author.spec` passes on desktop and Pixel 7 (edit, save, reload, change persists) |
| FR-UE-04 | 🟡 | Implemented in `lib/aem.ts`; no test and never exercised against an AEM tenant |

### 3.3 Discovery and pricing (FR-STY)

| ID | Status | Evidence or gap |
|---|:-:|---|
| FR-STY-01 | ✅ | Web tests *accepts valid params and coerces guests*, *degrades gracefully on garbage input*, *builds a 3-night default two weeks out* |
| FR-STY-02 | ✅ | Shared tests *computes nights across month boundaries*, *rejects zero-night and over-long stays*, *coerces guests…*; web test *formats dates in UTC so ISO days never shift* |
| FR-STY-03 | 🟡 | Implemented in `StayPage` (`useSuspenseQuery` + `useQuery`); browser behaviour unobserved |
| FR-STY-04 | ✅ | API test *prices stays with weekend uplift, taxes and fees*; web test *formats currency* |
| FR-STY-05 | ✅ | API test *flags rooms that cannot fit the party* |
| FR-STY-06 | 🟡 | Implemented in `StayPage`; not tested |
| FR-STY-07 | 🟡 | Implemented in `DiningPage`; price-tier clamp tested (*clamps price tiers*); page not tested |

### 3.4 Booking (FR-BKG)

| ID | Status | Evidence or gap |
|---|:-:|---|
| FR-BKG-01 | ✅ | API test *requires an Idempotency-Key and replays safely* |
| FR-BKG-02 | ✅ | API test *prevents overbooking (penthouse inventory is 2)* |
| FR-BKG-03 | 🟡 | Implemented in `BookPage`; shared test *validates reservation guest email*; Playwright `booking.spec` passes (empty submit shows an alert, then a valid submit completes). Focus moving to the first invalid field is not asserted |
| FR-BKG-04 | 🟡 | Playwright `booking.spec` asserts the confirmation ID is shown; focus on the heading is implemented but not asserted |
| FR-BKG-05 | ✅ | API test *validates query params*; shared reservation schema tests |
| FR-BKG-06 | 🟡 | Implemented (`invalidateQueries(['ops'])`); not tested |
| FR-BKG-07 | 🟡 | Implemented; not tested |

### 3.5 Operations console (FR-OPS)

| ID | Status | Evidence or gap |
|---|:-:|---|
| FR-OPS-01 | ✅ | API test *computes ops stats*; UI implemented, not rendered in a browser |
| FR-OPS-02 | ✅ | API test *lists reservations with server-side sorting, filtering and paging* |
| FR-OPS-03 | 🟡 | `aria-sort` present in `ReservationsTable`; `/ops` is **not** covered by the axe e2e scans (home, stay, dining, showcase only) |
| FR-OPS-04 | ✅ | Production build output lists `ReservationsTable` and `RevenueChart` as their own chunks |
| FR-OPS-05 | 🟡 | Implemented; not tested |

### 3.6 Observability and resilience (FR-OBS)

| ID | Status | Evidence or gap |
|---|:-:|---|
| FR-OBS-01 | ✅ | API test *reports liveness and readiness*; SIGTERM handler in `server.ts` (not exercised) |
| FR-OBS-02 | ✅ | API test *accepts beacon (text/plain) samples and summarises p75*; shared test *rates vitals against published thresholds* |
| FR-OBS-03 | 🟡 | `onSend` hook in `app.ts`; not asserted |
| FR-OBS-04 | 🟡 | `QuerySection` per section; Playwright `resilience.spec` forces a 503 on content and asserts an alert appears while primary navigation stays usable. The *Try again* click is not asserted |
| FR-OBS-05 | 🟡 | Configured in `providers.tsx`; not tested |
| FR-OBS-06 | 🟡 | `/api/resilience` and `/api/resilience/chaos` (requires author token) implemented; not tested |
| FR-OBS-07 | ✅ | Web tests *fans out to adapters and isolates failures*, *honours consent* |
| FR-OBS-08 | 🟡 | `StaleBanner` driven by `x-content-stale`; not tested |

### 3.7 Security (FR-SEC)

| ID | Status | Evidence or gap |
|---|:-:|---|
| FR-SEC-01 | ✅ | API test *requires an author token* |
| FR-SEC-02 | ✅ | API test *refuses the default author token in production* |
| FR-SEC-03 | 🟡 | Configured in `app.ts` (helmet, cors, rate-limit, `bodyLimit`); rate limit is bypassed under test, so not asserted |
| FR-SEC-04 | ✅ | API tests *rejects edits that violate the content model*, *validates query params*; shared schema tests |
| FR-SEC-05 | ✅ | `nginx.conf.template` + `nginx-security-headers.conf` ran under stock nginx 1.24 (outside the image): all four headers on `/`, SPA routes, assets, images and proxied routes; a real-browser pass through it showed zero CSP violations. The test **found and fixed** two defects: per-location `add_header` dropped the security headers, and the inline theme script would have been blocked. The image itself was never built |
| FR-SEC-06 | 🟡 | `modules/api_service` listener rule; Terraform not validated or applied here |
| FR-SEC-07 | 🟡 | `api_service` and `envs/*` Terraform, `deploy.yml`; not applied or run |
| FR-SEC-08 | 🟡 | `deploy.yml` builds with `VITE_AUTHOR_TOKEN=''`; workflow not run |

### 3.8 Site UI and accessibility (FR-UI)

| ID | Status | Evidence or gap |
|---|:-:|---|
| FR-UI-01 | 🟡 | Playwright visits `/`, `/stay`, `/dining`, `/showcase`, `/book`; a scripted browser pass through nginx also loaded `/ops` with no console errors. No test asserts the not-found page |
| FR-UI-02 | ✅ | Playwright `a11y.spec`: the first Tab focuses the skip link and Enter moves focus to `#main` (desktop and mobile projects) |
| FR-UI-03 | 🟡 | `RootLayout` (comment and `role=status` region); not tested |
| FR-UI-04 | ✅ | Axe (WCAG 2.1 A/AA) passes on home, stay, dining and showcase in light and dark, desktop and Pixel 7 (Playwright, 16 scans); component-level axe passes. **`/ops` and `/book` are not axe-scanned**; axe cannot judge everything |
| FR-UI-05 | 🟡 | `ui-store` (persisted); the theme script is now a same-origin file (`public/theme-init.js`) so the CSP stays `script-src 'self'`; both themes pass axe. Absence of flash is not measured |
| FR-UI-06 | 🟡 | Media query in `index.css`; not tested |
| FR-UI-07 | 🟡 | Responsive utilities throughout; Pixel 7 (412 px) Playwright project passes all 13 specs; 360 px never viewed |
| FR-UI-08 | 🟡 | Button base `min-h-11`, nav links `min-h-11`; other controls unmeasured |
| FR-UI-09 | ✅ | Web tests *reserves intrinsic space to prevent layout shift*, *prioritises the LCP candidate* |
| FR-UI-10 | 🟡 | Implemented; `docs/JD_TRACEABILITY.md` is generated from the same data; page not tested |

### 3.9 Non-functional requirements (NFR)

| ID | Status | Evidence or gap |
|---|:-:|---|
| NFR-PERF-01 | ✅ | `npm run build` ran green: entry 42.2 kB, total 202.8 kB |
| NFR-PERF-02 | ✅ | `lighthouserc.json` ran locally (Chromium 131, desktop preset, 1 run per URL): performance 1.0, accessibility 0.98 to 1.0, LCP 0.56 to 0.64 s, CLS ≤ 0.009, TBT ≤ 16 ms on `/`, `/stay`, `/dining`; all assertions passed. CI uses 3 runs |
| NFR-PERF-03 | ✅ | Build shows per-page chunks; loaders use `void prefetchQuery` |
| NFR-MNT-01 | ✅ | `tsc --noEmit` clean in all packages; `eslint . --max-warnings 0` clean; `prettier --check` clean |
| NFR-MNT-02 | ✅ | 41 unit/integration tests pass (7 shared, 21 API, 13 web); Playwright **26 pass** (13 specs × desktop and Pixel 7). Coverage is reported in CI but no threshold is enforced |
| NFR-DEV-01 | 🟡 | `ci.yml`, `.github/rulesets/protect-main.json`; `actionlint` clean; every job's commands were run locally except Docker, `terraform validate` and Trivy. Never run on GitHub |
| NFR-DEV-02 | 🟡 | `apps/*/Dockerfile`; `hadolint` clean; build stages simulated without Docker (same file copies, `npm ci --workspace …`, build, production boot: `/readyz` 200 and a persisted query 200). The images themselves were never built |
| NFR-DEV-03 | 🟡 | `infra/terraform`; `tofu fmt -check` clean (same formatter as `terraform fmt`); `tfsec` v1.28.11 clean with documented exclusions (`.tfsec/config.yml`); static check that every variable, resource, output and module argument resolves. `terraform validate` needs provider downloads, which were blocked here, so it was **not** run |
| NFR-DEV-04 | 🟡 | `deploy.yml`, `modules/api_service`; not run |
| NFR-DEV-05 | 🟡 | Built and tested on Linux only; `WALKTHROUGH.md` documents the others |
| NFR-DEV-06 | 🟡 | `ci.yml`, `codeql.yml` (`if` public repository), `deploy.yml` (`if` role variable set); `actionlint` clean; by design review, not testable without GitHub |
| NFR-DOC-01 | ✅ | `docs/adr/0001` to `0006`, `docs/JD_TRACEABILITY.md` (generated from `traceability.ts`) |

## 4. Deviations from a "complete" production system
1. **In-memory stores.** Content edits, reservations and vitals vanish on restart. Production: AEM Publish for content, PostgreSQL for reservations (unique idempotency key, inventory check in the same transaction), a metrics backend for vitals.
2. **No authentication on the operator surface** (`/ops`, `GET /api/reservations`, `/api/ops/stats`, `/api/vitals/summary`). Put it behind SSO at the edge or add authorisation before exposure.
3. **Author token is a shared secret**, suitable for a demo. Production editing goes through AEM and the Universal Editor, which bring their own authentication; the production web build embeds no token (FR-SEC-08).
4. **No payment, guest accounts, email or cancellation.** A reservation is created as `pending`/`confirmed` data only.
5. **Content is seeded**, not fetched from AEM. The contract (persisted queries, models, UE files) is what a real AEM would need to satisfy; it was never run against one.
6. **CSP on the API is disabled** (`helmet` with `contentSecurityPolicy: false`); the web tier carries the CSP. Acceptable for a JSON API, worth stating.
7. **Images are generated SVG placeholders**, not photography; real LCP numbers will differ.
8. **Wireframes are Markdown drawings**, not design files, and were not compared to a rendered build.
9. **No AI component.** Deliberate; the workflow is deterministic.

## 5. Items not executed in this environment
* `docker build` and `docker run` of either image (stages were simulated, nginx was run directly), container health checks, and the Trivy scan.
* Any GitHub Actions run (`ci.yml`, `codeql.yml`, `deploy.yml`). The `ci-ok (required check)` name can only be selected in the ruleset after a first run.
* `terraform validate`, `plan` and `apply` (provider downloads were blocked). `terraform fmt` semantics were checked with OpenTofu's identical formatter.
* Playwright with Playwright's own Chromium (a bundled Chromium 131 was used instead), Firefox and WebKit.
* Accessibility beyond automated checks: screen reader, keyboard-only walkthrough, real contrast in practice; `/ops` and `/book` are not axe-scanned.
* Windows 11 and WSL execution of `WALKTHROUGH.md`.
* Load, soak and fault injection against a deployed stack; 360 px layout.

## 6. Residual risks and next steps
| # | Risk | Action |
|---|---|---|
| 1 | Page components other than the exercised journeys are untested | Add route-level tests for Stay, Book and Ops |
| 2 | Accessibility beyond automated scans is design intent | Add `/ops` and `/book` to the axe e2e; screen-reader and keyboard pass |
| 3 | Coverage is reported but not gated | Add thresholds per package once a baseline exists |
| 4 | Terraform `validate` and the Docker images unproven | First PR run; fix what `validate` or the image build reveals before merging |
| 5 | Unauthenticated operator surface | SSO at CloudFront or an authorisation layer before any exposure |
| 6 | In-memory reservations | PostgreSQL with the idempotency and inventory constraints described in §4 |
| 7 | Content parse at the query layer has no direct test | Add a contract test feeding malformed fragments to `contentQueries` |
| 8 | UE files never tested against AEM | Import into a sandbox AEMaaCS author and run the Universal Editor against the deployed site |
| 9 | Trivy is report-only | Promote to a gate (`exit-code: 1`) once the team wants CVE policy enforced |
