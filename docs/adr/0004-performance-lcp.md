# ADR 0004: Performance and LCP
**Status:** Accepted
- Route-level code splitting; heavy table/chart in separate chunks; budget enforced in CI (`check-bundle-size.mjs`: entry 90 kB, total 260 kB gz).
- LCP: hero image preloaded in `index.html`, `fetchpriority=high`, explicit dimensions, responsive `srcset`; below-fold images lazy + async decode.
- Loaders prefetch (never await) so chunk and data load in parallel.
- Suspense skeletons sized to final layout (CLS ≈ 0).
- Web Vitals reported to `/api/vitals`; Lighthouse CI asserts budgets on PRs.
