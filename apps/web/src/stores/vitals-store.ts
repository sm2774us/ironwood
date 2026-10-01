import type { VitalSample } from '@ironwood/shared';
import { create } from 'zustand';

interface VitalsState {
  latest: Partial<Record<VitalSample['name'], VitalSample>>;
  record: (s: VitalSample) => void;
}

export const useVitalsStore = create<VitalsState>((set) => ({
  latest: {},
  record: (s) => set((st) => ({ latest: { ...st.latest, [s.name]: s } })),
}));
