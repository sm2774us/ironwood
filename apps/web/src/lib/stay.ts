import { addDays, stayQuerySchema, toISODate, type StayQuery } from '@ironwood/shared';

/** Validates untrusted URL search params; invalid input degrades to "no params" instead of crashing. */
export function parseStaySearch(raw: Record<string, unknown>): Partial<StayQuery> {
  const parsed = stayQuerySchema.safeParse(raw);
  return parsed.success ? parsed.data : {};
}

export function defaultStay(today = new Date()): StayQuery {
  const checkIn = addDays(toISODate(today), 14);
  return { checkIn, checkOut: addDays(checkIn, 3), guests: 2 };
}

export const resolveStay = (partial: Partial<StayQuery>): StayQuery => ({
  ...defaultStay(),
  ...partial,
});
