import { z } from 'zod';

const MS_PER_DAY = 86_400_000;

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), 'Invalid date');

export const toISODate = (d: Date): string => d.toISOString().slice(0, 10);

export const addDays = (iso: string, days: number): string =>
  toISODate(new Date(Date.parse(`${iso}T00:00:00Z`) + days * MS_PER_DAY));

export const nightsBetween = (checkIn: string, checkOut: string): number =>
  Math.round(
    (Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / MS_PER_DAY,
  );

export const MAX_NIGHTS = 30;

const stayShape = {
  checkIn: isoDateSchema,
  checkOut: isoDateSchema,
  guests: z.coerce.number().int().min(1, 'At least 1 guest').max(8, 'Up to 8 guests'),
};

const validStay = (v: { checkIn: string; checkOut: string }): boolean => {
  const n = nightsBetween(v.checkIn, v.checkOut);
  return n >= 1 && n <= MAX_NIGHTS;
};
const stayMessage = { message: `Stay must be 1–${MAX_NIGHTS} nights`, path: ['checkOut'] };

export const stayQuerySchema = z.object(stayShape).refine(validStay, stayMessage);
export type StayQuery = z.infer<typeof stayQuerySchema>;

export const guestSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(60),
  lastName: z.string().trim().min(1, 'Last name is required').max(60),
  email: z.string().trim().email('Enter a valid email address').max(120),
});
export type GuestDetails = z.infer<typeof guestSchema>;

export const reservationRequestSchema = z
  .object({
    roomId: z.string().min(1),
    ...stayShape,
    guest: guestSchema,
    specialRequests: z.string().max(500).optional(),
  })
  .refine(validStay, stayMessage);
export type ReservationRequest = z.infer<typeof reservationRequestSchema>;

export const reservationStatusSchema = z.enum(['pending', 'confirmed', 'checked_in', 'cancelled']);
export type ReservationStatus = z.infer<typeof reservationStatusSchema>;

export const reservationSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  roomName: z.string(),
  checkIn: isoDateSchema,
  checkOut: isoDateSchema,
  nights: z.number().int().positive(),
  guests: z.number().int().positive(),
  guest: guestSchema,
  status: reservationStatusSchema,
  totalCents: z.number().int().nonnegative(),
  createdAt: z.string(),
});
export type Reservation = z.infer<typeof reservationSchema>;

export const availabilityItemSchema = z.object({
  roomId: z.string(),
  slug: z.string(),
  nights: z.number().int(),
  unitsLeft: z.number().int().nonnegative(),
  available: z.boolean(),
  fitsParty: z.boolean(),
  nightlyAverageCents: z.number().int(),
  subtotalCents: z.number().int(),
  taxesCents: z.number().int(),
  feesCents: z.number().int(),
  totalCents: z.number().int(),
});
export type AvailabilityItem = z.infer<typeof availabilityItemSchema>;

export const reservationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(['checkIn', 'totalCents', 'guest', 'status', 'createdAt']).default('checkIn'),
  order: z.enum(['asc', 'desc']).default('desc'),
  status: reservationStatusSchema.optional(),
  q: z.string().trim().max(80).optional(),
});
export type ReservationListQuery = z.infer<typeof reservationListQuerySchema>;

export const reservationPageSchema = z.object({
  items: z.array(reservationSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
export type ReservationPage = z.infer<typeof reservationPageSchema>;

export const statsSchema = z.object({
  totals: z.object({
    reservations: z.number().int(),
    revenueCents: z.number().int(),
    adrCents: z.number().int(),
    occupancyPct: z.number(),
  }),
  daily: z.array(
    z.object({
      date: isoDateSchema,
      occupiedUnits: z.number().int(),
      totalUnits: z.number().int(),
      revenueCents: z.number().int(),
    }),
  ),
});
export type OpsStats = z.infer<typeof statsSchema>;
