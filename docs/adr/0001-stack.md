# ADR 0001: Stack
**Status:** Accepted
React 18.3 + TypeScript 5.6 strict, Vite, Tailwind + Radix (shadcn-style owned components), TanStack Query/Router/Table, Zustand, Motion. Fastify 5 API. Turborepo monorepo with shared zod schemas.
**Why:** owned UI code (no vendor lock-in), type safety end to end, fast CI via task caching. React 19 deliberately not used: the target codebase is on 18.
**Trade-offs:** more assembly than a monolithic framework; mitigated by conventions documented here.
