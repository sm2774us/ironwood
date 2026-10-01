import { rateVital, type VitalSample } from '@ironwood/shared';
import { useVitalsStore } from '@/stores/vitals-store';
import { analytics } from './index';

/**
 * Real-user Core Web Vitals. `web-vitals` is dynamically imported so it never competes with the
 * critical path; samples are beaconed to the API (RUM) and fanned out to analytics.
 */
export async function reportWebVitals(
  getRoute: () => string = () => location.pathname,
): Promise<void> {
  const { onLCP, onCLS, onINP, onFCP, onTTFB } = await import('web-vitals');
  const handler = (m: {
    name: string;
    value: number;
    id: string;
    navigationType?: string;
  }): void => {
    const name = m.name as VitalSample['name'];
    const sample: VitalSample = {
      name,
      value: Math.round(m.value * 1000) / 1000,
      rating: rateVital(name, m.value),
      id: m.id,
      route: getRoute(),
      ...(m.navigationType ? { navigationType: m.navigationType } : {}),
    };
    useVitalsStore.getState().record(sample);
    analytics.track('web_vital', {
      name,
      value: sample.value,
      rating: sample.rating,
      route: sample.route,
    });
    try {
      navigator.sendBeacon(
        '/api/vitals',
        new Blob([JSON.stringify(sample)], { type: 'text/plain' }),
      );
    } catch {
      /* non-critical */
    }
  };
  onLCP(handler);
  onCLS(handler);
  onINP(handler);
  onFCP(handler);
  onTTFB(handler);
}
