# AEM Headless Integration

## Contract
| Concern | Implementation |
|---|---|
| Content Fragment Models | `packages/shared/src/content.ts` (zod) ⇄ `ue/component-models.json` |
| Persisted queries | `apps/api/src/graphql/schema.ts` → `GET /graphql/execute.json/<project>/<name>;param=value` |
| Caching | ETag + `Cache-Control` with stale-while-revalidate; CDN-cacheable (GET only) |
| Ad-hoc GraphQL | `POST /graphql` disabled in production (same as AEM Publish) |
| Validation | Every response parsed with the shared zod schema at the boundary (`apps/web/src/features/content/queries.ts`) |
| Universal Editor | `data-aue-resource/prop/type/model/label` via `apps/web/src/lib/aem.ts` and `<Editable>` |
| Fault tolerance | retry + circuit breaker + last-known-good (`x-content-stale`) |

## Persisted queries
`home-hero`, `offers-list`, `rooms-list`, `venues-list` (see `PERSISTED_QUERIES`). Frontend never sends query text; AEM devs own the query, frontend owns the shape it validates.

## Going live on AEMaaCS
1. Create Content Fragment Models matching `ue/component-models.json`; publish the four persisted queries under `/ironwood`.
2. Set `VITE_AEM_AUTHOR_URL` (author tenant) and `VITE_AEM_DELIVERY_URL` (publish/CDN); the app emits `urn:adobe:aue:system:aemconnection` and loads the UE CORS helper only when framed.
3. Add `ue/component-*.json` to the project's Universal Editor configuration.
4. Point CloudFront `/graphql/*` origin at AEM Publish (Terraform `web_cdn` module variable).

## Local author mode
`/?author=1` enables a built-in inline editor writing via `PATCH /api/content/:model/:id` (`x-author-token`), so the flow is demonstrable without an AEM tenant.
