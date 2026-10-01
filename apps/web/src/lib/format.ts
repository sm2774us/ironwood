const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const usdCents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const formatUsd = (dollars: number): string => usd.format(dollars);
export const formatCents = (cents: number, withCents = false): string =>
  (withCents ? usdCents : usd).format(cents / 100);

export const formatDate = (
  iso: string,
  opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
): string =>
  new Intl.DateTimeFormat('en-US', { ...opts, timeZone: 'UTC' }).format(
    new Date(`${iso}T00:00:00Z`),
  );

export const formatRange = (a: string, b: string): string => `${formatDate(a)} – ${formatDate(b)}`;
export const priceTier = (n: number): string => '$'.repeat(Math.max(1, Math.min(4, n)));
