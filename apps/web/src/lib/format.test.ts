import { describe, expect, it } from 'vitest';
import { formatCents, formatDate, formatRange, formatUsd, priceTier } from './format';

describe('format', () => {
  it('formats currency', () => {
    expect(formatUsd(229)).toBe('$229');
    expect(formatCents(123456)).toBe('$1,235');
    expect(formatCents(123456, true)).toBe('$1,234.56');
  });
  it('formats dates in UTC so ISO days never shift', () => {
    expect(formatDate('2026-07-01')).toBe('Jul 1');
    expect(formatRange('2026-07-01', '2026-07-04')).toBe('Jul 1 – Jul 4');
  });
  it('clamps price tiers', () => {
    expect(priceTier(3)).toBe('$$$');
    expect(priceTier(9)).toBe('$$$$');
  });
});
