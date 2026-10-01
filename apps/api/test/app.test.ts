import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { loadConfig } from '../src/config';
import { CircuitBreaker, CircuitOpenError, retry } from '../src/lib/resilience';
import { UpstreamError } from '../src/lib/errors';

const TOKEN = 'test-author-token';
const NOW = new Date('2026-06-10T12:00:00Z');
let app: FastifyInstance;
let rngValue = 0.99;

const cfg = (extra: Record<string, string> = {}) =>
  loadConfig({ NODE_ENV: 'test', AUTHOR_TOKEN: TOKEN, ...extra } as NodeJS.ProcessEnv);

beforeEach(async () => {
  rngValue = 0.99;
  app = await buildApp({ config: cfg(), rng: () => rngValue, now: () => NOW });
});
afterEach(async () => app.close());

const PQ = '/graphql/execute.json/ironwood';

describe('health', () => {
  it('reports liveness and readiness', async () => {
    expect((await app.inject('/healthz')).json()).toEqual({ status: 'ok' });
    expect((await app.inject('/readyz')).json()).toMatchObject({
      status: 'ready',
      breaker: 'closed',
    });
  });
});

describe('persisted queries', () => {
  it('serves rooms with cache headers and ETag revalidation', async () => {
    const res = await app.inject(`${PQ}/rooms-list`);
    expect(res.statusCode).toBe(200);
    expect(res.json().data.roomList.items).toHaveLength(4);
    expect(res.headers['cache-control']).toContain('stale-while-revalidate');
    const again = await app.inject({
      url: `${PQ}/rooms-list`,
      headers: { 'if-none-match': res.headers.etag as string },
    });
    expect(again.statusCode).toBe(304);
  });

  it('passes AEM-style matrix params as variables', async () => {
    const res = await app.inject(`${PQ}/room-by-slug;slug=stage-suite`);
    expect(res.json().data.roomBySlug.item.name).toBe('Stage Suite');
  });

  it('404s unknown persisted queries and blocks ad-hoc GraphQL in production', async () => {
    expect((await app.inject(`${PQ}/nope`)).statusCode).toBe(404);
    const prod = await buildApp({
      config: cfg({ NODE_ENV: 'production', AUTHOR_TOKEN: 'prod-token-123' }),
    });
    const res = await prod.inject({
      method: 'POST',
      url: '/graphql',
      payload: { query: '{ roomList { items { name } } }' },
    });
    expect(res.statusCode).toBe(404);
    await prod.close();
  });

  it('allows ad-hoc GraphQL outside production', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      payload: { query: '{ venueList { items { name } } }' },
    });
    expect(res.json().data.venueList.items.length).toBeGreaterThan(0);
  });

  it('serves last-known-good content (marked stale) when the upstream fails', async () => {
    await app.inject(`${PQ}/offers-list`); // warm the LKG cache
    rngValue = 0; // every upstream call now fails
    await app.inject({
      method: 'POST',
      url: '/api/resilience/chaos',
      headers: { 'x-author-token': TOKEN },
      payload: { rate: 1 },
    });
    const res = await app.inject(`${PQ}/offers-list`);
    expect(res.statusCode).toBe(200);
    expect(res.headers['x-content-stale']).toBe('true');
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('returns 503 when the upstream fails and nothing is cached', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/resilience/chaos',
      headers: { 'x-author-token': TOKEN },
      payload: { rate: 1 },
    });
    rngValue = 0;
    const res = await app.inject(`${PQ}/venues-list`);
    expect(res.statusCode).toBeGreaterThanOrEqual(500);
  });
});

describe('authoring', () => {
  const patch = (token: string | undefined, body: unknown, id = 'hero-home') =>
    app.inject({
      method: 'PATCH',
      url: `/api/content/hero/${id}`,
      headers: token ? { 'x-author-token': token } : {},
      payload: body as object,
    });

  it('requires an author token', async () => {
    expect((await patch(undefined, { prop: 'title', value: 'x' })).statusCode).toBe(401);
    expect((await patch('wrong-token', { prop: 'title', value: 'x' })).statusCode).toBe(401);
  });

  it('edits a fragment and is visible to subsequent reads', async () => {
    const res = await patch(TOKEN, { prop: 'cta.label', value: 'Book now' });
    expect(res.statusCode).toBe(200);
    const hero = (await app.inject(`${PQ}/home-hero`)).json().data.heroList.items[0];
    expect(hero.cta.label).toBe('Book now');
  });

  it('rejects edits that violate the content model', async () => {
    expect((await patch(TOKEN, { prop: 'title', value: '' })).statusCode).toBe(422);
    expect((await patch(TOKEN, { prop: 'image.width', value: '5' })).statusCode).toBe(422);
    expect((await patch(TOKEN, { prop: 'title', value: 'x' }, 'missing')).statusCode).toBe(404);
  });
});

describe('availability + reservations', () => {
  const q = 'checkIn=2026-07-01&checkOut=2026-07-04&guests=2';
  const body = {
    roomId: 'room-penthouse-residence',
    checkIn: '2026-07-01',
    checkOut: '2026-07-04',
    guests: 2,
    guest: { firstName: 'Sam', lastName: 'Lee', email: 'sam@example.com' },
  };
  const book = (key?: string, payload: object = body) =>
    app.inject({
      method: 'POST',
      url: '/api/reservations',
      headers: key ? { 'idempotency-key': key } : {},
      payload,
    });

  it('prices stays with weekend uplift, taxes and fees', async () => {
    const { items } = (await app.inject(`/api/availability?${q}`)).json();
    const sk = items.find((i: { slug: string }) => i.slug === 'skyline-king');
    expect(sk.nights).toBe(3);
    expect(sk.totalCents).toBe(sk.subtotalCents + sk.taxesCents + sk.feesCents);
    expect(sk.available).toBe(true);
  });

  it('flags rooms that cannot fit the party', async () => {
    const { items } = (
      await app.inject('/api/availability?checkIn=2026-07-01&checkOut=2026-07-02&guests=5')
    ).json();
    expect(items.find((i: { slug: string }) => i.slug === 'skyline-king').fitsParty).toBe(false);
  });

  it('validates query params', async () => {
    expect(
      (await app.inject('/api/availability?checkIn=bad&checkOut=2026-07-04&guests=2')).statusCode,
    ).toBe(400);
  });

  it('requires an Idempotency-Key and replays safely', async () => {
    expect((await book()).statusCode).toBe(400);
    const first = await book('key-12345678');
    const second = await book('key-12345678');
    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(200);
    expect(second.headers['idempotent-replayed']).toBe('true');
    expect(second.json().id).toBe(first.json().id);
  });

  it('prevents overbooking (penthouse inventory is 2)', async () => {
    const free = { ...body, checkIn: '2026-09-01', checkOut: '2026-09-02' };
    expect((await book('overbook-a-1', free)).statusCode).toBe(201);
    expect((await book('overbook-b-2', free)).statusCode).toBe(201);
    expect((await book('overbook-c-3', free)).statusCode).toBe(409);
  });

  it('lists reservations with server-side sorting, filtering and paging', async () => {
    const page = (
      await app.inject('/api/reservations?pageSize=5&sort=totalCents&order=desc')
    ).json();
    expect(page.items).toHaveLength(5);
    expect(page.items[0].totalCents).toBeGreaterThanOrEqual(page.items[4].totalCents);
    const cancelled = (await app.inject('/api/reservations?status=cancelled&pageSize=100')).json();
    expect(cancelled.items.every((r: { status: string }) => r.status === 'cancelled')).toBe(true);
  });

  it('computes ops stats', async () => {
    const s = (await app.inject('/api/ops/stats')).json();
    expect(s.daily).toHaveLength(14);
    expect(s.totals.occupancyPct).toBeGreaterThanOrEqual(0);
  });
});

describe('vitals', () => {
  it('accepts beacon (text/plain) samples and summarises p75', async () => {
    for (const value of [1000, 2000, 3000, 5000]) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/vitals',
        headers: { 'content-type': 'text/plain' },
        payload: JSON.stringify({
          name: 'LCP',
          value,
          rating: 'good',
          id: `v-${value}`,
          route: '/',
        }),
      });
      expect(res.statusCode).toBe(204);
    }
    const summary = (await app.inject('/api/vitals/summary')).json();
    expect(summary.LCP).toMatchObject({ count: 4, p75: 3000, rating: 'needs-improvement' });
  });
});

describe('resilience primitives', () => {
  it('opens after repeated failures and half-opens after the reset timeout', async () => {
    let t = 0;
    const b = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 100, now: () => t });
    const fail = () => b.exec(() => Promise.reject(new UpstreamError()));
    await expect(fail()).rejects.toBeInstanceOf(UpstreamError);
    await expect(fail()).rejects.toBeInstanceOf(UpstreamError);
    expect(b.state).toBe('open');
    await expect(b.exec(async () => 1)).rejects.toBeInstanceOf(CircuitOpenError);
    t = 150;
    expect(b.state).toBe('half-open');
    await expect(b.exec(async () => 'ok')).resolves.toBe('ok');
    expect(b.state).toBe('closed');
  });

  it('retries transient errors only', async () => {
    let calls = 0;
    const sleep = async () => {};
    const result = await retry(
      async () => {
        calls += 1;
        if (calls < 3) throw new UpstreamError();
        return 'done';
      },
      { retries: 3, baseMs: 1, sleep },
    );
    expect(result).toBe('done');
    await expect(
      retry(
        async () => {
          throw new Error('fatal');
        },
        { retries: 3, baseMs: 1, sleep },
      ),
    ).rejects.toThrow('fatal');
  });
});

describe('config', () => {
  it('refuses the default author token in production', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' } as NodeJS.ProcessEnv)).toThrow(
      /AUTHOR_TOKEN/,
    );
  });
});
