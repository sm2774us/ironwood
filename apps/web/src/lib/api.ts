import type { z } from 'zod';
import { useAuthorStore } from '@/stores/author-store';
import { useResilienceStore } from '@/stores/resilience-store';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const AUTHOR_TOKEN: string = import.meta.env.VITE_AUTHOR_TOKEN ?? 'demo-author-token';

async function parseError(res: Response): Promise<ApiError> {
  const body = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
  return new ApiError(
    res.status,
    body.code ?? 'HTTP_ERROR',
    body.message ?? `Request failed (${res.status})`,
  );
}

/** Typed REST helper: every response is validated with zod at the boundary. */
export async function fetchJson<S extends z.ZodTypeAny>(
  url: string,
  schema: S,
  init: RequestInit = {},
): Promise<z.infer<S>> {
  const res = await fetch(url, {
    ...init,
    headers: { accept: 'application/json', ...init.headers },
  });
  if (!res.ok) throw await parseError(res);
  return schema.parse(await res.json()) as z.infer<S>;
}

/**
 * Fetch a pre-registered (persisted) GraphQL query using AEM's GET contract:
 *   /graphql/execute.json/<project>/<query>;param=value
 * GET + stable URLs make responses CDN-cacheable; there is no query text on the wire.
 */
export async function fetchPersisted<S extends z.ZodTypeAny>(
  name: string,
  schema: S,
  params: Record<string, string> = {},
  signal?: AbortSignal,
): Promise<z.infer<S>> {
  const matrix = Object.entries(params)
    .map(([k, v]) => `;${k}=${encodeURIComponent(v)}`)
    .join('');
  const authoring = useAuthorStore.getState().enabled;
  const res = await fetch(`/graphql/execute.json/ironwood/${name}${matrix}`, {
    signal,
    // Authors must always see their latest edit; visitors get CDN/browser caching.
    cache: authoring ? 'no-store' : 'default',
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw await parseError(res);
  useResilienceStore.getState().setStale(res.headers.get('x-content-stale') === 'true');
  const json = (await res.json()) as { data?: unknown; errors?: { message: string }[] };
  if (json.errors?.length)
    throw new ApiError(502, 'GRAPHQL_ERROR', json.errors.map((e) => e.message).join('; '));
  return schema.parse(json.data) as z.infer<S>;
}
