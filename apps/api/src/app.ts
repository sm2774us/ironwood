import { randomUUID, createHash, timingSafeEqual } from 'node:crypto';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import { ZodError, z } from 'zod';
import {
  CONTENT_MODELS,
  contentModelSchema,
  patchContentSchema,
  reservationListQuerySchema,
  reservationRequestSchema,
  stayQuerySchema,
  vitalSampleSchema,
} from '@ironwood/shared';
import type { Config } from './config';
import { PERSISTED_QUERIES, isPersisted, runQuery } from './graphql/schema';
import { AppError, UpstreamError, notFound, unauthorized } from './lib/errors';
import { CircuitBreaker, CircuitOpenError, retry } from './lib/resilience';
import { ContentStore } from './store/content-store';
import { ReservationStore } from './store/reservation-store';
import { VitalsStore } from './store/vitals-store';

export interface BuildOptions {
  config: Config;
  rng?: () => number;
  now?: () => Date;
}

const etagOf = (body: string): string =>
  `"${createHash('sha1').update(body).digest('base64url').slice(0, 22)}"`;

const safeEqual = (a: string, b: string): boolean => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
};

export async function buildApp({
  config,
  rng = Math.random,
  now = () => new Date(),
}: BuildOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      config.NODE_ENV === 'test'
        ? false
        : {
            level: config.LOG_LEVEL,
            redact: ['req.headers.authorization', 'req.headers["x-author-token"]'],
          },
    genReqId: (req) => (req.headers['x-request-id'] as string | undefined) ?? randomUUID(),
    trustProxy: true,
    bodyLimit: 64 * 1024,
  });

  const content = new ContentStore();
  const reservations = new ReservationStore(content.rooms, now);
  const vitals = new VitalsStore();
  const breaker = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 10_000 });
  const chaos = { rate: config.CHAOS_RATE };
  const lastKnownGood = new Map<string, unknown>();

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    exposedHeaders: ['x-content-stale', 'x-request-id'],
  });
  await app.register(rateLimit, {
    max: 300,
    timeWindow: '1 minute',
    allowList: () => config.NODE_ENV === 'test',
  });

  app.addHook('onSend', async (req, reply) => {
    reply.header('x-request-id', req.id);
  });

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof ZodError) {
      return reply.status(400).send({
        code: 'VALIDATION',
        message: 'Invalid request',
        issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    if (err instanceof AppError)
      return reply.status(err.statusCode).send({ code: err.code, message: err.message });
    const status = (err as { statusCode?: number }).statusCode ?? 500;
    if (status >= 500) req.log.error({ err }, 'unhandled error');
    return reply.status(status).send({
      code: status >= 500 ? 'INTERNAL' : 'BAD_REQUEST',
      message: status >= 500 ? 'Something went wrong' : (err as Error).message,
    });
  });

  app.setNotFoundHandler((_req, reply) =>
    reply.status(404).send({ code: 'NOT_FOUND', message: 'Route not found' }),
  );

  const requireAuthor = (req: FastifyRequest): void => {
    const token = req.headers['x-author-token'];
    if (typeof token !== 'string' || !safeEqual(token, config.AUTHOR_TOKEN)) throw unauthorized();
  };

  // ── Health ────────────────────────────────────────────────────────────────
  app.get('/healthz', async () => ({ status: 'ok' }));
  app.get('/readyz', async () => ({
    status: 'ready',
    contentVersion: content.version,
    breaker: breaker.state,
  }));

  // ── Headless content delivery (AEM persisted-query contract) ──────────────
  const executeResilient = async (
    name: keyof typeof PERSISTED_QUERIES,
    vars: Record<string, unknown>,
  ) => {
    const key = `${name}:${JSON.stringify(vars)}`;
    try {
      const result = await breaker.exec(() =>
        retry(
          async () => {
            if (rng() < chaos.rate) throw new UpstreamError();
            return runQuery(content, PERSISTED_QUERIES[name].query, vars);
          },
          { retries: 2, baseMs: 20 },
        ),
      );
      const body = JSON.parse(JSON.stringify(result)) as unknown;
      lastKnownGood.set(key, body);
      return { body, stale: false };
    } catch (err) {
      const cached = lastKnownGood.get(key);
      if (cached && (err instanceof UpstreamError || err instanceof CircuitOpenError))
        return { body: cached, stale: true };
      throw err instanceof CircuitOpenError
        ? new AppError(503, 'UPSTREAM_UNAVAILABLE', 'Content service unavailable')
        : err;
    }
  };

  // AEM style: /graphql/execute.json/<project>/<query>;param=value;param2=value
  app.get<{ Params: { project: string; query: string } }>(
    '/graphql/execute.json/:project/:query',
    async (req, reply) => {
      const [name = '', ...pairs] = req.params.query.split(';');
      if (!isPersisted(name)) throw notFound(`Persisted query "${name}"`);
      const vars: Record<string, unknown> = {};
      for (const p of pairs) {
        const [k, ...v] = p.split('=');
        if (k && (PERSISTED_QUERIES[name].params as readonly string[]).includes(k))
          vars[k] = decodeURIComponent(v.join('='));
      }
      const { body, stale } = await executeResilient(name, vars);
      const payload = JSON.stringify(body);
      const etag = etagOf(payload);
      reply.header('etag', etag).header('content-type', 'application/json; charset=utf-8');
      reply.header(
        'cache-control',
        stale ? 'no-store' : 'public, max-age=30, stale-while-revalidate=120',
      );
      if (stale) reply.header('x-content-stale', 'true');
      if (req.headers['if-none-match'] === etag) return reply.status(304).send();
      return reply.send(payload);
    },
  );

  // Ad-hoc GraphQL is disabled in production, exactly as on AEM publish.
  app.post('/graphql', async (req) => {
    if (config.NODE_ENV === 'production' && !config.ENABLE_ADHOC_GRAPHQL) throw notFound('Route');
    const body = z
      .object({ query: z.string().max(4000), variables: z.record(z.unknown()).optional() })
      .parse(req.body);
    return runQuery(content, body.query, body.variables);
  });

  // ── Authoring (stand-in for the Universal Editor → AEM write path) ────────
  app.patch<{ Params: { model: string; id: string } }>('/api/content/:model/:id', async (req) => {
    requireAuthor(req);
    const model = contentModelSchema.parse(req.params.model);
    const { prop, value } = patchContentSchema.parse(req.body);
    const updated = content.patch(model, req.params.id, prop, value);
    CONTENT_MODELS[model].parse(updated);
    lastKnownGood.clear();
    return { ok: true, version: content.version, fragment: updated };
  });

  // ── Availability & reservations (REST) ────────────────────────────────────
  app.get('/api/availability', async (req) => {
    const q = stayQuerySchema.parse(req.query);
    return { items: reservations.availability(content.rooms(), q.checkIn, q.checkOut, q.guests) };
  });

  app.post('/api/reservations', async (req, reply) => {
    const key = req.headers['idempotency-key'];
    if (typeof key !== 'string' || key.length < 8 || key.length > 80) {
      throw new AppError(
        400,
        'IDEMPOTENCY_KEY_REQUIRED',
        'Idempotency-Key header (8–80 chars) is required',
      );
    }
    const body = reservationRequestSchema.parse(req.body);
    const room = content.rooms().find((r) => r._id === body.roomId);
    if (!room) throw notFound('Room');
    const { reservation, replayed } = reservations.create(body, room, key);
    if (replayed) reply.header('idempotent-replayed', 'true');
    return reply.status(replayed ? 200 : 201).send(reservation);
  });

  app.get('/api/reservations', async (req) =>
    reservations.list(reservationListQuerySchema.parse(req.query)),
  );
  app.get('/api/ops/stats', async () => reservations.stats(content.rooms()));

  // ── Real-user monitoring ───────────────────────────────────────────────────
  app.post('/api/vitals', async (req, reply) => {
    // sendBeacon posts text/plain; accept both encodings.
    const raw = typeof req.body === 'string' ? (JSON.parse(req.body) as unknown) : req.body;
    vitals.add(vitalSampleSchema.parse(raw));
    return reply.status(204).send();
  });
  app.get('/api/vitals/summary', async () => vitals.summary());

  // ── Resilience demo controls ───────────────────────────────────────────────
  app.get('/api/resilience', async () => ({ chaosRate: chaos.rate, breaker: breaker.state }));
  app.post('/api/resilience/chaos', async (req) => {
    requireAuthor(req);
    chaos.rate = z.object({ rate: z.number().min(0).max(1) }).parse(req.body).rate;
    return { chaosRate: chaos.rate, breaker: breaker.state };
  });

  app.addContentTypeParser('text/plain', { parseAs: 'string' }, (_req, body, done) =>
    done(null, body),
  );

  return app;
}
