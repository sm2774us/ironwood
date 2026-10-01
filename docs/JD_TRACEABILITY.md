# JD Traceability

Generated from `apps/web/src/features/showcase/traceability.ts` (also rendered at `/showcase`).

## Frontend

| Requirement | Implementation | Evidence |
|---|---|---|
| Maintain and extend a React app in TypeScript & modern JavaScript (ES6+) | React 18.3 + TypeScript 5.6 strict (noUncheckedIndexedAccess, verbatimModuleSyntax); ES2022 features throughout (structuredClone, Object.hasOwn, ??=). | `apps/web/src`<br>`tsconfig.base.json` |
| Clean, well-structured, well-tested code | Feature-sliced layout, zod-validated boundaries, 40+ unit/integration tests across 3 packages plus Playwright e2e. | `apps/api/test/app.test.ts`<br>`apps/web/src/components/Editable.test.tsx`<br>`packages/shared/src/shared.test.ts` |
| Follow established architecture patterns & coding standards | ADRs record each decision; ESLint flat config (typescript-eslint, react-hooks, jsx-a11y) with zero-warning gate; Prettier; CODEOWNERS; PR template. | `docs/adr`<br>`eslint.config.js`<br>`CODEOWNERS` |
| Performance: code-splitting & lazy-loading of heavy components | Every route is a lazy chunk; Ops table and chart are separately lazy; web-vitals is dynamically imported; vendor manualChunks; CI bundle-size budget. | `apps/web/src/app/router.tsx`<br>`apps/web/src/pages/OpsPage.tsx`<br>`apps/web/scripts/check-bundle-size.mjs` |
| Efficient component-level data fetching | TanStack Query with per-section Suspense islands, prefetch-without-await route loaders (no waterfalls), keepPreviousData paging, query-key factories, deferred search input. | `apps/web/src/features`<br>`apps/web/src/pages/HomePage.tsx` |
| Core Web Vitals, especially LCP on media-heavy pages | Preloaded fetchpriority=high hero, intrinsic image dimensions (CLS=0), srcset/sizes via AEM Delivery, lazy below-fold media, transform-only hero animation, system fonts, real-user vitals beaconed to the API, Lighthouse CI budgets. | `apps/web/index.html`<br>`apps/web/src/components/ResponsiveImage.tsx`<br>`apps/web/src/analytics/vitals.ts`<br>`lighthouserc.json` |
| Responsive, accessible interfaces (WCAG) | Radix primitives, skip link, route announcer + focus management, aria-sort tables, error summaries with focus, 44px targets, reduced-motion support, light/dark contrast-checked tokens, axe in unit and e2e tests. | `apps/web/src/app/RootLayout.tsx`<br>`apps/web/src/index.css`<br>`apps/web/e2e/a11y.spec.ts` |
| CI/CD pipeline setup, testing strategy, lifecycle | GitHub Actions: lint/typecheck/test/build, Playwright e2e, Lighthouse CI, CodeQL, Docker build + smoke test + Trivy report, Terraform fmt/validate/tfsec, OIDC deploy to ECS/CloudFront; no bot-generated pull requests. | `.github/workflows` |

## AEM headless

| Requirement | Implementation | Evidence |
|---|---|---|
| Fetch content via GraphQL persisted queries | AEM-contract GET /graphql/execute.json/<project>/<query>;param=value with ETag + stale-while-revalidate; ad-hoc GraphQL disabled in production. | `apps/api/src/graphql/schema.ts`<br>`apps/web/src/lib/api.ts` |
| Instrument components with Universal Editor data attributes | data-aue-resource/prop/type/label/model on every authored field and component; UE connection meta tags and CORS helper installed when an AEM tenant is configured. | `apps/web/src/lib/aem.ts`<br>`apps/web/src/components/Editable.tsx`<br>`ue/component-models.json` |
| Collaborate on content fragment models & GraphQL schemas | Content models are shared zod schemas used by both API and UI; UE model/definition/filter JSON included; docs describe the contract. | `packages/shared/src/content.ts`<br>`ue`<br>`docs/AEM_INTEGRATION.md` |
| Clear separation of presentation and content layers | UI only consumes validated DTOs through feature query modules; the content store is swappable for a real AEM client with zero UI changes. | `docs/adr/0003-headless-content-contract.md`<br>`apps/api/src/store/content-store.ts` |

## Quality & delivery

| Requirement | Implementation | Evidence |
|---|---|---|
| Code reviews & audits with practical feedback | PR template with review checklist, CODEOWNERS, CodeQL + dependency review in CI. | `.github/pull_request_template.md`<br>`CODEOWNERS` |
| Refactoring & modernization | ADR-0006 documents an incremental path from legacy patterns; strict TS flags and lint gates keep the codebase modern; upgrades are deliberate, reviewed pull requests. | `docs/adr` |
| Sprint planning, estimation, technical decision-making | Decisions captured as ADRs with alternatives and consequences so non-authors can follow the reasoning. | `docs/adr` |

## Qualifications

| Requirement | Implementation | Evidence |
|---|---|---|
| State management (Redux Toolkit, Zustand, MobX) | Zustand for client state (theme, author mode, booking draft with sessionStorage persistence, resilience flag); TanStack Query owns server state. | `apps/web/src/stores`<br>`docs/adr/0002-state-management.md` |
| CSS-in-JS, CSS Modules or Tailwind | Tailwind CSS with design tokens as CSS variables, shadcn/ui-style owned components, class-variance-authority variants. | `apps/web/tailwind.config.ts`<br>`apps/web/src/components/ui` |
| REST, GraphQL and async programming | REST for transactional domain (availability, idempotent reservations); GraphQL for content; AbortSignal-aware queries, retries with backoff, circuit breaker server-side. | `apps/api/src/app.ts`<br>`apps/api/src/lib/resilience.ts` |
| CI/CD (GitHub Actions, CircleCI) | Reusable, cached, least-privilege workflows with concurrency control and OIDC (no long-lived cloud keys). | `.github/workflows/ci.yml`<br>`.github/workflows/deploy.yml` |
| Testing: Jest, React Testing Library, Cypress/Playwright | Vitest (Jest-compatible API) + React Testing Library + vitest-axe; Playwright e2e on desktop and mobile with @axe-core/playwright. | `apps/web/e2e`<br>`apps/web/vite.config.ts` |

## Nice to have

| Requirement | Implementation | Evidence |
|---|---|---|
| AEM as a Cloud Service / headless content fragments, GraphQL, Universal Editor | AEMaaCS-shaped endpoints and models, Delivery-style image URLs, UE instrumentation and authoring write-path simulation with live in-page editing. | `docs/AEM_INTEGRATION.md`<br>`ue` |
| Monorepo tooling (Nx/Turborepo) | npm workspaces + Turborepo task graph with remote-cache-ready outputs. | `turbo.json`<br>`package.json` |
| Micro-frontend familiarity | Route-level lazy modules with isolated data contracts are extraction-ready; ADR-0005 describes a Module Federation path and when not to use it. | `docs/adr/0005-micro-frontends.md` |
| Analytics (Adobe Analytics, GA, LogRocket) | Vendor-neutral facade with GA4 dataLayer and Adobe Client Data Layer adapters, DNT-aware consent, isolated adapter failures. | `apps/web/src/analytics/index.ts` |
| Open-source contributions | MIT-licensed, documented, contribution-ready repository. | `LICENSE`<br>`CONTRIBUTING.md` |
