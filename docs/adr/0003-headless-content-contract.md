# ADR 0003: Headless content contract
**Status:** Accepted
Presentation and content are separated by a schema contract: AEM owns fragments and persisted queries; the frontend owns rendering and validates responses with zod.
- Persisted GET queries only in production (CDN-cacheable, no query injection).
- Drift fails loudly at one boundary, not deep in components.
- Shared schemas are the agreed artifact in reviews with AEM developers; `ue/component-models.json` is derived from them.
- Degradation: last-known-good content served stale rather than an error page.
