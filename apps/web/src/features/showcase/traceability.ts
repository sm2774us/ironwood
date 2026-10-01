export type Area =
  'Frontend' | 'AEM headless' | 'Quality & delivery' | 'Qualifications' | 'Nice to have';

export interface Trace {
  area: Area;
  requirement: string;
  implementation: string;
  evidence: string[];
}

/** Single source of truth mapping every JD line to the code that demonstrates it. Mirrored in docs/JD_TRACEABILITY.md. */
export const TRACEABILITY: Trace[] = [
  {
    area: 'Frontend',
    requirement: 'Maintain and extend a React app in TypeScript & modern JavaScript (ES6+)',
    implementation:
      'React 18.3 + TypeScript 5.6 strict (noUncheckedIndexedAccess, verbatimModuleSyntax); ES2022 features throughout (structuredClone, Object.hasOwn, ??=).',
    evidence: ['apps/web/src', 'tsconfig.base.json'],
  },
  {
    area: 'Frontend',
    requirement: 'Clean, well-structured, well-tested code',
    implementation:
      'Feature-sliced layout, zod-validated boundaries, 40+ unit/integration tests across 3 packages plus Playwright e2e.',
    evidence: [
      'apps/api/test/app.test.ts',
      'apps/web/src/components/Editable.test.tsx',
      'packages/shared/src/shared.test.ts',
    ],
  },
  {
    area: 'Frontend',
    requirement: 'Follow established architecture patterns & coding standards',
    implementation:
      'ADRs record each decision; ESLint flat config (typescript-eslint, react-hooks, jsx-a11y) with zero-warning gate; Prettier; CODEOWNERS; PR template.',
    evidence: ['docs/adr', 'eslint.config.js', 'CODEOWNERS'],
  },
  {
    area: 'Frontend',
    requirement: 'Performance: code-splitting & lazy-loading of heavy components',
    implementation:
      'Every route is a lazy chunk; Ops table and chart are separately lazy; web-vitals is dynamically imported; vendor manualChunks; CI bundle-size budget.',
    evidence: [
      'apps/web/src/app/router.tsx',
      'apps/web/src/pages/OpsPage.tsx',
      'apps/web/scripts/check-bundle-size.mjs',
    ],
  },
  {
    area: 'Frontend',
    requirement: 'Efficient component-level data fetching',
    implementation:
      'TanStack Query with per-section Suspense islands, prefetch-without-await route loaders (no waterfalls), keepPreviousData paging, query-key factories, deferred search input.',
    evidence: ['apps/web/src/features', 'apps/web/src/pages/HomePage.tsx'],
  },
  {
    area: 'Frontend',
    requirement: 'Core Web Vitals, especially LCP on media-heavy pages',
    implementation:
      'Preloaded fetchpriority=high hero, intrinsic image dimensions (CLS=0), srcset/sizes via AEM Delivery, lazy below-fold media, transform-only hero animation, system fonts, real-user vitals beaconed to the API, Lighthouse CI budgets.',
    evidence: [
      'apps/web/index.html',
      'apps/web/src/components/ResponsiveImage.tsx',
      'apps/web/src/analytics/vitals.ts',
      'lighthouserc.json',
    ],
  },
  {
    area: 'Frontend',
    requirement: 'Responsive, accessible interfaces (WCAG)',
    implementation:
      'Radix primitives, skip link, route announcer + focus management, aria-sort tables, error summaries with focus, 44px targets, reduced-motion support, light/dark contrast-checked tokens, axe in unit and e2e tests.',
    evidence: [
      'apps/web/src/app/RootLayout.tsx',
      'apps/web/src/index.css',
      'apps/web/e2e/a11y.spec.ts',
    ],
  },
  {
    area: 'Frontend',
    requirement: 'CI/CD pipeline setup, testing strategy, lifecycle',
    implementation:
      'GitHub Actions: lint/typecheck/test/build, Playwright e2e, Lighthouse CI, CodeQL, Docker build + smoke test + Trivy report, Terraform fmt/validate/tfsec, OIDC deploy to ECS/CloudFront; no bot-generated pull requests.',
    evidence: ['.github/workflows'],
  },
  {
    area: 'AEM headless',
    requirement: 'Fetch content via GraphQL persisted queries',
    implementation:
      'AEM-contract GET /graphql/execute.json/<project>/<query>;param=value with ETag + stale-while-revalidate; ad-hoc GraphQL disabled in production.',
    evidence: ['apps/api/src/graphql/schema.ts', 'apps/web/src/lib/api.ts'],
  },
  {
    area: 'AEM headless',
    requirement: 'Instrument components with Universal Editor data attributes',
    implementation:
      'data-aue-resource/prop/type/label/model on every authored field and component; UE connection meta tags and CORS helper installed when an AEM tenant is configured.',
    evidence: [
      'apps/web/src/lib/aem.ts',
      'apps/web/src/components/Editable.tsx',
      'ue/component-models.json',
    ],
  },
  {
    area: 'AEM headless',
    requirement: 'Collaborate on content fragment models & GraphQL schemas',
    implementation:
      'Content models are shared zod schemas used by both API and UI; UE model/definition/filter JSON included; docs describe the contract.',
    evidence: ['packages/shared/src/content.ts', 'ue', 'docs/AEM_INTEGRATION.md'],
  },
  {
    area: 'AEM headless',
    requirement: 'Clear separation of presentation and content layers',
    implementation:
      'UI only consumes validated DTOs through feature query modules; the content store is swappable for a real AEM client with zero UI changes.',
    evidence: ['docs/adr/0003-headless-content-contract.md', 'apps/api/src/store/content-store.ts'],
  },
  {
    area: 'Quality & delivery',
    requirement: 'Code reviews & audits with practical feedback',
    implementation:
      'PR template with review checklist, CODEOWNERS, CodeQL + dependency review in CI.',
    evidence: ['.github/pull_request_template.md', 'CODEOWNERS'],
  },
  {
    area: 'Quality & delivery',
    requirement: 'Refactoring & modernization',
    implementation:
      'ADR-0006 documents an incremental path from legacy patterns; strict TS flags and lint gates keep the codebase modern; upgrades are deliberate, reviewed pull requests.',
    evidence: ['docs/adr'],
  },
  {
    area: 'Quality & delivery',
    requirement: 'Sprint planning, estimation, technical decision-making',
    implementation:
      'Decisions captured as ADRs with alternatives and consequences so non-authors can follow the reasoning.',
    evidence: ['docs/adr'],
  },
  {
    area: 'Qualifications',
    requirement: 'State management (Redux Toolkit, Zustand, MobX)',
    implementation:
      'Zustand for client state (theme, author mode, booking draft with sessionStorage persistence, resilience flag); TanStack Query owns server state.',
    evidence: ['apps/web/src/stores', 'docs/adr/0002-state-management.md'],
  },
  {
    area: 'Qualifications',
    requirement: 'CSS-in-JS, CSS Modules or Tailwind',
    implementation:
      'Tailwind CSS with design tokens as CSS variables, shadcn/ui-style owned components, class-variance-authority variants.',
    evidence: ['apps/web/tailwind.config.ts', 'apps/web/src/components/ui'],
  },
  {
    area: 'Qualifications',
    requirement: 'REST, GraphQL and async programming',
    implementation:
      'REST for transactional domain (availability, idempotent reservations); GraphQL for content; AbortSignal-aware queries, retries with backoff, circuit breaker server-side.',
    evidence: ['apps/api/src/app.ts', 'apps/api/src/lib/resilience.ts'],
  },
  {
    area: 'Qualifications',
    requirement: 'CI/CD (GitHub Actions, CircleCI)',
    implementation:
      'Reusable, cached, least-privilege workflows with concurrency control and OIDC (no long-lived cloud keys).',
    evidence: ['.github/workflows/ci.yml', '.github/workflows/deploy.yml'],
  },
  {
    area: 'Qualifications',
    requirement: 'Testing: Jest, React Testing Library, Cypress/Playwright',
    implementation:
      'Vitest (Jest-compatible API) + React Testing Library + vitest-axe; Playwright e2e on desktop and mobile with @axe-core/playwright.',
    evidence: ['apps/web/e2e', 'apps/web/vite.config.ts'],
  },
  {
    area: 'Nice to have',
    requirement: 'AEM as a Cloud Service / headless content fragments, GraphQL, Universal Editor',
    implementation:
      'AEMaaCS-shaped endpoints and models, Delivery-style image URLs, UE instrumentation and authoring write-path simulation with live in-page editing.',
    evidence: ['docs/AEM_INTEGRATION.md', 'ue'],
  },
  {
    area: 'Nice to have',
    requirement: 'Monorepo tooling (Nx/Turborepo)',
    implementation: 'npm workspaces + Turborepo task graph with remote-cache-ready outputs.',
    evidence: ['turbo.json', 'package.json'],
  },
  {
    area: 'Nice to have',
    requirement: 'Micro-frontend familiarity',
    implementation:
      'Route-level lazy modules with isolated data contracts are extraction-ready; ADR-0005 describes a Module Federation path and when not to use it.',
    evidence: ['docs/adr/0005-micro-frontends.md'],
  },
  {
    area: 'Nice to have',
    requirement: 'Analytics (Adobe Analytics, GA, LogRocket)',
    implementation:
      'Vendor-neutral facade with GA4 dataLayer and Adobe Client Data Layer adapters, DNT-aware consent, isolated adapter failures.',
    evidence: ['apps/web/src/analytics/index.ts'],
  },
  {
    area: 'Nice to have',
    requirement: 'Open-source contributions',
    implementation: 'MIT-licensed, documented, contribution-ready repository.',
    evidence: ['LICENSE', 'CONTRIBUTING.md'],
  },
];
