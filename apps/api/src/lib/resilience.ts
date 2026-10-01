import { UpstreamError } from './errors';

export type BreakerState = 'closed' | 'open' | 'half-open';

export class CircuitOpenError extends Error {
  constructor() {
    super('Circuit open');
    this.name = 'CircuitOpenError';
  }
}

export interface BreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
  now?: () => number;
}

/** Minimal closed → open → half-open circuit breaker. */
export class CircuitBreaker {
  private failures = 0;
  private openedAt = 0;
  private current: BreakerState = 'closed';
  private readonly now: () => number;

  constructor(private readonly opts: BreakerOptions) {
    this.now = opts.now ?? Date.now;
  }

  get state(): BreakerState {
    if (this.current === 'open' && this.now() - this.openedAt >= this.opts.resetTimeoutMs) {
      this.current = 'half-open';
    }
    return this.current;
  }

  async exec<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') throw new CircuitOpenError();
    try {
      const result = await fn();
      this.failures = 0;
      this.current = 'closed';
      return result;
    } catch (err) {
      this.failures += 1;
      if (this.current === 'half-open' || this.failures >= this.opts.failureThreshold) {
        this.current = 'open';
        this.openedAt = this.now();
      }
      throw err;
    }
  }
}

export interface RetryOptions {
  retries: number;
  baseMs: number;
  sleep?: (ms: number) => Promise<void>;
  shouldRetry?: (err: unknown) => boolean;
}

/** Exponential backoff with full jitter; only retries transient upstream failures by default. */
export async function retry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const shouldRetry = opts.shouldRetry ?? ((e: unknown) => e instanceof UpstreamError);
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= opts.retries || !shouldRetry(err)) throw err;
      await sleep(Math.random() * opts.baseMs * 2 ** attempt);
      attempt += 1;
    }
  }
}
