import { buildSchema, graphql } from 'graphql';
import type { ContentStore } from '../store/content-store';

/**
 * Schema shaped like the one AEM generates from Content Fragment Models:
 * `<model>List { items }`, `<model>ByPath(_path) { item }` and underscore-prefixed metadata.
 */
export const schema = buildSchema(/* GraphQL */ `
  type ImageRef {
    _path: String!
    width: Int!
    height: Int!
    alt: String!
  }
  type Cta {
    label: String!
    href: String!
  }

  type Hero {
    _id: ID!
    _path: String!
    eyebrow: String!
    title: String!
    subtitle: String!
    cta: Cta!
    image: ImageRef!
  }
  type Offer {
    _id: ID!
    _path: String!
    title: String!
    summary: String!
    badge: String!
    validThrough: String!
    ctaLabel: String!
    image: ImageRef!
  }
  type Room {
    _id: ID!
    _path: String!
    slug: String!
    name: String!
    tagline: String!
    description: String!
    sizeSqFt: Int!
    maxGuests: Int!
    bedType: String!
    nightlyRate: Float!
    amenities: [String!]!
    image: ImageRef!
  }
  type Venue {
    _id: ID!
    _path: String!
    slug: String!
    name: String!
    cuisine: String!
    description: String!
    priceTier: Int!
    hours: String!
    reservationsRequired: Boolean!
    image: ImageRef!
  }

  type HeroList {
    items: [Hero!]!
  }
  type OfferList {
    items: [Offer!]!
  }
  type RoomList {
    items: [Room!]!
  }
  type VenueList {
    items: [Venue!]!
  }
  type RoomResult {
    item: Room
  }

  type Query {
    heroList: HeroList!
    offerList: OfferList!
    roomList: RoomList!
    roomBySlug(slug: String!): RoomResult!
    venueList: VenueList!
  }
`);

const IMG = '_path width height alt';

/**
 * Persisted queries: the only operations executable in production. Clients reference them by
 * name via GET (CDN-cacheable) — arbitrary query text is never accepted from the public internet.
 */
export const PERSISTED_QUERIES = {
  'home-hero': {
    query: `query HomeHero { heroList { items { _id _path eyebrow title subtitle cta { label href } image { ${IMG} } } } }`,
    params: [] as string[],
  },
  'offers-list': {
    query: `query Offers { offerList { items { _id _path title summary badge validThrough ctaLabel image { ${IMG} } } } }`,
    params: [],
  },
  'rooms-list': {
    query: `query Rooms { roomList { items { _id _path slug name tagline description sizeSqFt maxGuests bedType nightlyRate amenities image { ${IMG} } } } }`,
    params: [],
  },
  'room-by-slug': {
    query: `query RoomBySlug($slug: String!) { roomBySlug(slug: $slug) { item { _id _path slug name tagline description sizeSqFt maxGuests bedType nightlyRate amenities image { ${IMG} } } } }`,
    params: ['slug'],
  },
  'venues-list': {
    query: `query Venues { venueList { items { _id _path slug name cuisine description priceTier hours reservationsRequired image { ${IMG} } } } }`,
    params: [],
  },
} as const;

export type PersistedQueryName = keyof typeof PERSISTED_QUERIES;
export const isPersisted = (n: string): n is PersistedQueryName =>
  Object.hasOwn(PERSISTED_QUERIES, n);

export function buildRoot(store: ContentStore) {
  return {
    heroList: () => ({ items: store.heroes() }),
    offerList: () => ({ items: store.offers() }),
    roomList: () => ({ items: store.rooms() }),
    roomBySlug: ({ slug }: { slug: string }) => ({
      item: store.rooms().find((r) => r.slug === slug) ?? null,
    }),
    venueList: () => ({ items: store.venues() }),
  };
}

export async function runQuery(
  store: ContentStore,
  source: string,
  variableValues?: Record<string, unknown>,
) {
  return graphql({ schema, source, rootValue: buildRoot(store), variableValues });
}
