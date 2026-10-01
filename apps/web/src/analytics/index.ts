/**
 * Vendor-neutral analytics facade. Components call `track()`; adapters translate to
 * GA4 (dataLayer), Adobe Client Data Layer, or the console in dev. Swapping or adding a vendor
 * (LogRocket, Adobe Analytics via Launch) never touches feature code.
 */
export type EventParams = Record<string, string | number | boolean>;

export interface AnalyticsAdapter {
  readonly name: string;
  track(event: string, params: EventParams): void;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    adobeDataLayer?: unknown[];
  }
}

export const ga4Adapter: AnalyticsAdapter = {
  name: 'ga4',
  track(event, params) {
    (window.dataLayer ??= []).push({ event, ...params });
  },
};

/** Adobe Client Data Layer event shape consumed by Adobe Launch / Analytics rules. */
export const adobeAdapter: AnalyticsAdapter = {
  name: 'adobe-acdl',
  track(event, params) {
    (window.adobeDataLayer ??= []).push({ event, eventInfo: params });
  },
};

export class Analytics {
  private adapters: AnalyticsAdapter[] = [];
  private consent = true;

  register(adapter: AnalyticsAdapter): void {
    this.adapters = [...this.adapters.filter((a) => a.name !== adapter.name), adapter];
  }
  setConsent(v: boolean): void {
    this.consent = v;
  }
  /** Analytics must never break the app: each adapter is isolated. */
  track(event: string, params: EventParams = {}): void {
    if (!this.consent) return;
    for (const a of this.adapters) {
      try {
        a.track(event, params);
      } catch {
        /* swallow */
      }
    }
  }
}

export const analytics = new Analytics();

export function initAnalytics(): void {
  // Respect Do-Not-Track by default.
  analytics.setConsent(navigator.doNotTrack !== '1');
  analytics.register(ga4Adapter);
  analytics.register(adobeAdapter);
  const ga = import.meta.env.VITE_GA4_ID as string | undefined;
  if (ga) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga)}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push(['js', new Date()], ['config', ga, { send_page_view: false }]);
  }
}
