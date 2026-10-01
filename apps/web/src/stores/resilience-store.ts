import { create } from 'zustand';

interface ResilienceState {
  stale: boolean;
  setStale: (v: boolean) => void;
}

/** Set whenever the content API served last-known-good data while the upstream (AEM) is degraded. */
export const useResilienceStore = create<ResilienceState>((set) => ({
  stale: false,
  setStale: (stale) => set({ stale }),
}));
