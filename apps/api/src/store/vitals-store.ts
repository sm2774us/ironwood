import {
  VITAL_THRESHOLDS,
  rateVital,
  type VitalName,
  type VitalSample,
  type VitalsSummary,
} from '@ironwood/shared';

/** Bounded ring buffer of real-user Core Web Vitals samples (RUM). */
export class VitalsStore {
  private samples: VitalSample[] = [];
  constructor(private readonly capacity = 1000) {}

  add(sample: VitalSample): void {
    this.samples.push(sample);
    if (this.samples.length > this.capacity) this.samples.shift();
  }

  summary(): VitalsSummary {
    const out: VitalsSummary = {};
    for (const name of Object.keys(VITAL_THRESHOLDS) as VitalName[]) {
      const values = this.samples
        .filter((s) => s.name === name)
        .map((s) => s.value)
        .sort((a, b) => a - b);
      if (!values.length) continue;
      const p75 = values[
        Math.min(values.length - 1, Math.ceil(values.length * 0.75) - 1)
      ] as number;
      out[name] = { p75, count: values.length, rating: rateVital(name, p75) };
    }
    return out;
  }
}
