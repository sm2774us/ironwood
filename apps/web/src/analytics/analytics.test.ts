import { describe, expect, it, vi } from 'vitest';
import { Analytics, type AnalyticsAdapter } from './index';

describe('Analytics facade', () => {
  it('fans out to adapters and isolates failures', () => {
    const a = new Analytics();
    const ok = vi.fn();
    const bad: AnalyticsAdapter = {
      name: 'bad',
      track: () => {
        throw new Error('boom');
      },
    };
    a.register(bad);
    a.register({ name: 'ok', track: ok });
    expect(() => a.track('page_view', { path: '/' })).not.toThrow();
    expect(ok).toHaveBeenCalledWith('page_view', { path: '/' });
  });
  it('honours consent', () => {
    const a = new Analytics();
    const spy = vi.fn();
    a.register({ name: 's', track: spy });
    a.setConsent(false);
    a.track('x');
    expect(spy).not.toHaveBeenCalled();
  });
});
