import {
  reservationPageSchema,
  statsSchema,
  vitalsSummarySchema,
  type ReservationListQuery,
} from '@ironwood/shared';
import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { AUTHOR_TOKEN, fetchJson } from '@/lib/api';

export const opsQueries = {
  stats: () =>
    queryOptions({
      queryKey: ['ops', 'stats'],
      queryFn: () => fetchJson('/api/ops/stats', statsSchema),
      staleTime: 30_000,
    }),
  reservations: (q: Partial<ReservationListQuery>) =>
    queryOptions({
      queryKey: ['ops', 'reservations', q],
      queryFn: () => {
        const qs = new URLSearchParams();
        for (const [k, v] of Object.entries(q))
          if (v !== undefined && v !== '') qs.set(k, String(v));
        return fetchJson(`/api/reservations?${qs}`, reservationPageSchema);
      },
      placeholderData: keepPreviousData,
    }),
  vitals: () =>
    queryOptions({
      queryKey: ['ops', 'vitals'],
      queryFn: () => fetchJson('/api/vitals/summary', vitalsSummarySchema),
      refetchInterval: 10_000,
    }),
  resilience: () =>
    queryOptions({
      queryKey: ['ops', 'resilience'],
      queryFn: () =>
        fetchJson(
          '/api/resilience',
          z.object({ chaosRate: z.number(), breaker: z.enum(['closed', 'open', 'half-open']) }),
        ),
      refetchInterval: 3_000,
    }),
};

export const setChaos = (rate: number) =>
  fetchJson('/api/resilience/chaos', z.object({ chaosRate: z.number() }).passthrough(), {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-author-token': AUTHOR_TOKEN },
    body: JSON.stringify({ rate }),
  });
