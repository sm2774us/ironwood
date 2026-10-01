import { describe, expect, it } from 'vitest';
import { defaultStay, parseStaySearch, resolveStay } from './stay';

describe('stay search params', () => {
  it('accepts valid params and coerces guests', () => {
    expect(parseStaySearch({ checkIn: '2026-08-01', checkOut: '2026-08-03', guests: '3' })).toEqual(
      {
        checkIn: '2026-08-01',
        checkOut: '2026-08-03',
        guests: 3,
      },
    );
  });
  it('degrades gracefully on garbage input', () => {
    expect(parseStaySearch({ checkIn: 'soon', guests: 'lots' })).toEqual({});
  });
  it('builds a 3-night default two weeks out', () => {
    const d = defaultStay(new Date('2026-06-01T00:00:00Z'));
    expect(d).toEqual({ checkIn: '2026-06-15', checkOut: '2026-06-18', guests: 2 });
    expect(resolveStay({ guests: 4 }).guests).toBe(4);
  });
});
