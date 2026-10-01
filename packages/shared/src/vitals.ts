import { z } from 'zod';

export const vitalNameSchema = z.enum(['LCP', 'CLS', 'INP', 'FCP', 'TTFB']);
export type VitalName = z.infer<typeof vitalNameSchema>;

export const vitalSampleSchema = z.object({
  name: vitalNameSchema,
  value: z.number().finite().nonnegative(),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
  id: z.string().max(64),
  route: z.string().max(200),
  navigationType: z.string().max(40).optional(),
});
export type VitalSample = z.infer<typeof vitalSampleSchema>;

export const vitalsSummarySchema = z.record(
  vitalNameSchema,
  z.object({
    p75: z.number(),
    count: z.number().int(),
    rating: z.enum(['good', 'needs-improvement', 'poor']),
  }),
);
export type VitalsSummary = z.infer<typeof vitalsSummarySchema>;

/** Google's published Core Web Vitals thresholds: [good upper bound, poor lower bound]. */
export const VITAL_THRESHOLDS: Record<VitalName, readonly [number, number]> = {
  LCP: [2500, 4000],
  CLS: [0.1, 0.25],
  INP: [200, 500],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
};

export const rateVital = (name: VitalName, value: number): VitalSample['rating'] => {
  const [good, poor] = VITAL_THRESHOLDS[name];
  return value <= good ? 'good' : value <= poor ? 'needs-improvement' : 'poor';
};
