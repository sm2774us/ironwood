import { describe, expect, it } from 'vitest';
import {
  addDays,
  heroSchema,
  nightsBetween,
  rateVital,
  reservationRequestSchema,
  stayQuerySchema,
  ueResource,
} from './index';

describe('date helpers', () => {
  it('computes nights across month boundaries', () => {
    expect(nightsBetween('2026-01-30', '2026-02-02')).toBe(3);
    expect(addDays('2026-02-27', 2)).toBe('2026-03-01');
  });
});

describe('stay validation', () => {
  it('rejects zero-night and over-long stays', () => {
    expect(
      stayQuerySchema.safeParse({ checkIn: '2026-05-01', checkOut: '2026-05-01', guests: 2 })
        .success,
    ).toBe(false);
    expect(
      stayQuerySchema.safeParse({ checkIn: '2026-05-01', checkOut: '2026-07-01', guests: 2 })
        .success,
    ).toBe(false);
  });
  it('coerces guests from URL strings', () => {
    const r = stayQuerySchema.parse({ checkIn: '2026-05-01', checkOut: '2026-05-03', guests: '2' });
    expect(r.guests).toBe(2);
  });
  it('validates reservation guest email', () => {
    const base = { roomId: 'r', checkIn: '2026-05-01', checkOut: '2026-05-03', guests: 2 };
    const bad = reservationRequestSchema.safeParse({
      ...base,
      guest: { firstName: 'A', lastName: 'B', email: 'nope' },
    });
    expect(bad.success).toBe(false);
  });
});

describe('content + vitals', () => {
  it('builds a Universal Editor resource URN', () => {
    expect(ueResource('/content/dam/x/y')).toBe(
      'urn:aemconnection:/content/dam/x/y/jcr:content/data/master',
    );
  });
  it('rejects hero fragments outside /content/dam', () => {
    expect(heroSchema.safeParse({ _id: '1', _path: '/etc/x' }).success).toBe(false);
  });
  it('rates vitals against published thresholds', () => {
    expect(rateVital('LCP', 2400)).toBe('good');
    expect(rateVital('LCP', 3000)).toBe('needs-improvement');
    expect(rateVital('CLS', 0.3)).toBe('poor');
  });
});
