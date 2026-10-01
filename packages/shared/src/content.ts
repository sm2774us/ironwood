import { z } from 'zod';

/**
 * Content-fragment models. These mirror the AEM Content Fragment Models an AEM backend
 * team would publish (see docs/AEM_INTEGRATION.md). The frontend validates every GraphQL
 * response against them at the boundary, so a schema drift in AEM fails loudly in one
 * place instead of as `undefined is not a function` deep inside a component.
 */
export const imageRefSchema = z.object({
  _path: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().min(1).max(200),
});

const fragment = {
  _id: z.string().min(1),
  _path: z.string().startsWith('/content/dam/'),
};

export const heroSchema = z.object({
  ...fragment,
  eyebrow: z.string().max(60),
  title: z.string().min(1).max(90),
  subtitle: z.string().max(240),
  cta: z.object({ label: z.string().min(1).max(30), href: z.string().startsWith('/') }),
  image: imageRefSchema,
});

export const offerSchema = z.object({
  ...fragment,
  title: z.string().min(1).max(70),
  summary: z.string().max(220),
  badge: z.string().max(24),
  validThrough: z.string().max(40),
  ctaLabel: z.string().min(1).max(30),
  image: imageRefSchema,
});

export const roomSchema = z.object({
  ...fragment,
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(60),
  tagline: z.string().max(100),
  description: z.string().max(500),
  sizeSqFt: z.number().int().positive(),
  maxGuests: z.number().int().min(1).max(10),
  bedType: z.string().max(40),
  nightlyRate: z.number().positive(),
  amenities: z.array(z.string().max(40)).max(12),
  image: imageRefSchema,
});

export const venueSchema = z.object({
  ...fragment,
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(60),
  cuisine: z.string().max(60),
  description: z.string().max(400),
  priceTier: z.number().int().min(1).max(4),
  hours: z.string().max(80),
  reservationsRequired: z.boolean(),
  image: imageRefSchema,
});

export const CONTENT_MODELS = {
  hero: heroSchema,
  offer: offerSchema,
  room: roomSchema,
  venue: venueSchema,
} as const;

export type ContentModel = keyof typeof CONTENT_MODELS;
export const contentModelSchema = z.enum(['hero', 'offer', 'room', 'venue']);

export type ImageRef = z.infer<typeof imageRefSchema>;
export type Hero = z.infer<typeof heroSchema>;
export type Offer = z.infer<typeof offerSchema>;
export type Room = z.infer<typeof roomSchema>;
export type Venue = z.infer<typeof venueSchema>;

export const patchContentSchema = z.object({
  prop: z.string().regex(/^[A-Za-z][A-Za-z0-9]*(\.[A-Za-z][A-Za-z0-9]*)*$/),
  value: z.string().max(1000),
});
export type PatchContent = z.infer<typeof patchContentSchema>;

/** Universal Editor resource URN for a content fragment's master variation. */
export const ueResource = (path: string): string =>
  `urn:aemconnection:${path}/jcr:content/data/master`;
