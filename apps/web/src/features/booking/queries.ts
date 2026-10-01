import {
  availabilityItemSchema,
  reservationSchema,
  type ReservationRequest,
  type StayQuery,
} from '@ironwood/shared';
import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { fetchJson } from '@/lib/api';

export const bookingKeys = { availability: ['availability'] as const };

export const availabilityQuery = (stay: StayQuery) =>
  queryOptions({
    queryKey: [...bookingKeys.availability, stay],
    queryFn: async () => {
      const qs = new URLSearchParams({
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        guests: String(stay.guests),
      });
      return (
        await fetchJson(
          `/api/availability?${qs}`,
          z.object({ items: z.array(availabilityItemSchema) }),
        )
      ).items;
    },
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });

export const createReservation = (req: ReservationRequest, idempotencyKey: string) =>
  fetchJson('/api/reservations', reservationSchema, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': idempotencyKey },
    body: JSON.stringify(req),
  });
