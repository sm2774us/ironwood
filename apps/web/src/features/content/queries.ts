import {
  heroSchema,
  offerSchema,
  roomSchema,
  venueSchema,
  type ContentModel,
  type PatchContent,
} from '@ironwood/shared';
import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { AUTHOR_TOKEN, ApiError, fetchJson, fetchPersisted } from '@/lib/api';

const list = <T extends z.ZodTypeAny>(key: string, item: T) =>
  z.object({ [key]: z.object({ items: z.array(item) }) }) as unknown as z.ZodType<
    Record<string, { items: z.infer<T>[] }>
  >;

const heroes = list('heroList', heroSchema);
const offers = list('offerList', offerSchema);
const rooms = list('roomList', roomSchema);
const venues = list('venueList', venueSchema);
const roomBySlug = z.object({ roomBySlug: z.object({ item: roomSchema.nullable() }) });

/** Query-key factory: one place to invalidate "all content" after an authoring edit. */
export const contentKeys = { all: ['content'] as const };

export const contentQueries = {
  hero: () =>
    queryOptions({
      queryKey: [...contentKeys.all, 'hero'],
      queryFn: async ({ signal }) => {
        const d = await fetchPersisted('home-hero', heroes, {}, signal);
        const hero = d['heroList']?.items[0];
        if (!hero) throw new ApiError(404, 'NOT_FOUND', 'Hero content missing');
        return hero;
      },
    }),
  offers: () =>
    queryOptions({
      queryKey: [...contentKeys.all, 'offers'],
      queryFn: async ({ signal }) =>
        (await fetchPersisted('offers-list', offers, {}, signal))['offerList']?.items ?? [],
    }),
  rooms: () =>
    queryOptions({
      queryKey: [...contentKeys.all, 'rooms'],
      queryFn: async ({ signal }) =>
        (await fetchPersisted('rooms-list', rooms, {}, signal))['roomList']?.items ?? [],
    }),
  room: (slug: string) =>
    queryOptions({
      queryKey: [...contentKeys.all, 'room', slug],
      queryFn: async ({ signal }) => {
        const r = (await fetchPersisted('room-by-slug', roomBySlug, { slug }, signal)).roomBySlug
          .item;
        if (!r) throw new ApiError(404, 'NOT_FOUND', 'Room not found');
        return r;
      },
    }),
  venues: () =>
    queryOptions({
      queryKey: [...contentKeys.all, 'venues'],
      queryFn: async ({ signal }) =>
        (await fetchPersisted('venues-list', venues, {}, signal))['venueList']?.items ?? [],
    }),
};

export const patchContent = (model: ContentModel, id: string, body: PatchContent) =>
  fetchJson(
    `/api/content/${model}/${encodeURIComponent(id)}`,
    z.object({ ok: z.literal(true) }).passthrough(),
    {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-author-token': AUTHOR_TOKEN },
      body: JSON.stringify(body),
    },
  );
