# Ironwood Resorts — Hospitality Platform (Senior Frontend Engineer showcase)

A production-style, fault-tolerant hospitality web platform built to demonstrate every responsibility and requirement of a Senior Frontend Engineer role: React/TypeScript, AEM headless (persisted GraphQL + Universal Editor), performance/LCP, WCAG, CI/CD, testing, and IaC. Open `/showcase` in the running app for the live JD → code traceability matrix (also in [`docs/JD_TRACEABILITY.md`](docs/JD_TRACEABILITY.md)).

## Stack
**Web:** React 18.3.1 · TypeScript ^5.6.3 · Vite · Tailwind · Radix + shadcn-style owned components · TanStack Query / Router / Table · Zustand · Motion · web-vitals
**API:** Fastify 5 · AEM-style persisted GraphQL · zod · retry + circuit breaker + stale fallback
**Tooling:** npm workspaces + Turborepo · Vitest + RTL + vitest-axe · Playwright + axe · ESLint (a11y) · Prettier
**Delivery:** GitHub Actions (CI, CodeQL, OIDC deploy) · Docker · Terraform (AWS ECS Fargate + ALB + S3/CloudFront) · Lighthouse CI

## Quickstart
```bash
nvm use && npm ci
npm run dev            # web http://localhost:5173 · API :3001
npm run verify         # format, lint, typecheck, tests, build (+ bundle budget)
npm run test:e2e       # Playwright (after: npx playwright install chromium; npm run build)
docker compose up --build   # http://localhost:8080
```
Author mode (inline Universal-Editor-style editing): `http://localhost:5173/?author=1`.
Chaos / resilience demo: `CHAOS_RATE=0.3 npm run dev -w @ironwood/api`.

## Layout
```
apps/web        React app (features/, components/ui, stores/, e2e/)
apps/api        Fastify API (graphql/, store/, lib/resilience)
packages/shared zod content + booking schemas (single contract)
ue/             Universal Editor component definitions/models/filters
infra/terraform modules + envs (dev, prod)
docs/           SRS, SRS compliance, solution deep dive, ADRs, AEM guide, JD traceability
.github/        workflows, repository ruleset, PR template
```

## Key design points
- **Content contract:** persisted GET queries (CDN-cacheable), responses validated by shared zod schemas ([ADR 0003](docs/adr/0003-headless-content-contract.md)).
- **Performance:** route splitting, preloaded hero, bundle budget in CI, Lighthouse budgets ([ADR 0004](docs/adr/0004-performance-lcp.md)).
- **Fault tolerance:** per-section Suspense/error boundaries, API retry + breaker + last-known-good.
- **State:** Query (server) · Router (URL) · Zustand (UI) ([ADR 0002](docs/adr/0002-state-management.md)).
- **A11y:** Radix primitives, skip link, focus management, axe in unit + e2e.

## Deploy
See [`infra/terraform/README.md`](infra/terraform/README.md) and `.github/workflows/deploy.yml`. Replace `@your-github-handle` in `CODEOWNERS`.

MIT licensed.
