import { z } from 'zod';

const DEFAULT_TOKEN = 'demo-author-token';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3001),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:4173'),
  AUTHOR_TOKEN: z.string().min(8).default(DEFAULT_TOKEN),
  CHAOS_RATE: z.coerce.number().min(0).max(1).default(0),
  ENABLE_ADHOC_GRAPHQL: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

export type Config = z.infer<typeof envSchema> & { corsOrigins: string[] };

/** Fails fast on invalid configuration — a misconfigured pod should crash at boot, not at 3am. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.parse(env);
  if (parsed.NODE_ENV === 'production' && parsed.AUTHOR_TOKEN === DEFAULT_TOKEN) {
    throw new Error('AUTHOR_TOKEN must be overridden in production');
  }
  return {
    ...parsed,
    corsOrigins: parsed.CORS_ORIGINS.split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}
