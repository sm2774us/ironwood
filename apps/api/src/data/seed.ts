import type { Hero, Offer, Room, Venue } from '@ironwood/shared';

const DAM = '/content/dam/ironwood';
const img = (name: string, alt: string, w = 1200, h = 800) => ({
  _path: `/images/${name}.svg`,
  width: w,
  height: h,
  alt,
});

export const heroes: Hero[] = [
  {
    _id: 'hero-home',
    _path: `${DAM}/heroes/home`,
    eyebrow: 'Ironwood Resorts · Las Vegas',
    title: 'Where every night plays like a headline show',
    subtitle:
      'Sound-proofed suites, a rooftop stage and seven kitchens under one roof. Your encore starts at check-in.',
    cta: { label: 'Find your suite', href: '/stay' },
    image: img('hero', 'Neon-lit resort skyline at dusk', 1600, 900),
  },
];

export const offers: Offer[] = [
  {
    _id: 'offer-weekend-residency',
    _path: `${DAM}/offers/weekend-residency`,
    title: 'Weekend Residency',
    summary: 'Stay Friday to Sunday and receive a $150 dining credit plus late checkout.',
    badge: 'Most popular',
    validThrough: 'Through December 31',
    ctaLabel: 'Book the residency',
    image: img('offer-weekend', 'Guests enjoying a rooftop evening'),
  },
  {
    _id: 'offer-extended-encore',
    _path: `${DAM}/offers/extended-encore`,
    title: 'Extended Encore',
    summary: 'Book four nights, pay for three. Every fourth night is on the house.',
    badge: 'Save 25%',
    validThrough: 'Through March 15',
    ctaLabel: 'Claim the fourth night',
    image: img('offer-encore', 'Suite lounge with city view'),
  },
  {
    _id: 'offer-sound-check',
    _path: `${DAM}/offers/sound-check`,
    title: 'Sound Check Supper',
    summary: 'Two-course pre-show tasting menu with reserved seating at Amp Room.',
    badge: 'New',
    validThrough: 'Thursdays & Fridays',
    ctaLabel: 'Reserve a table',
    image: img('offer-supper', 'Candlelit dinner table'),
  },
];

export const rooms: Room[] = [
  {
    _id: 'room-skyline-king',
    _path: `${DAM}/rooms/skyline-king`,
    slug: 'skyline-king',
    name: 'Skyline King',
    tagline: 'Floor-to-ceiling views, studio-grade sound isolation',
    description:
      'A calm, acoustically treated retreat with a plush king bed, walk-in rain shower and a window wall that frames the Strip.',
    sizeSqFt: 480,
    maxGuests: 2,
    bedType: '1 King',
    nightlyRate: 229,
    amenities: ['City view', 'Rain shower', 'Smart TV', 'Nespresso'],
    image: img('room-skyline', 'Skyline King bedroom at night'),
  },
  {
    _id: 'room-double-platinum',
    _path: `${DAM}/rooms/double-platinum`,
    slug: 'double-platinum',
    name: 'Double Platinum',
    tagline: 'Room for the whole crew',
    description:
      'Two queen beds, a lounge corner and a marble bath. Built for friends, families and post-show debriefs.',
    sizeSqFt: 560,
    maxGuests: 4,
    bedType: '2 Queens',
    nightlyRate: 269,
    amenities: ['Lounge corner', 'Marble bath', 'Mini fridge', 'Pool access'],
    image: img('room-platinum', 'Double Platinum room with two queen beds'),
  },
  {
    _id: 'room-stage-suite',
    _path: `${DAM}/rooms/stage-suite`,
    slug: 'stage-suite',
    name: 'Stage Suite',
    tagline: 'A living room with a record collection',
    description:
      'Separate living area, turntable with curated vinyl, wet bar and a soaking tub you will not want to leave.',
    sizeSqFt: 920,
    maxGuests: 3,
    bedType: '1 King + Sofa bed',
    nightlyRate: 489,
    amenities: ['Turntable & vinyl', 'Wet bar', 'Soaking tub', 'Butler on call'],
    image: img('room-stage', 'Stage Suite living room with turntable'),
  },
  {
    _id: 'room-penthouse-residence',
    _path: `${DAM}/rooms/penthouse-residence`,
    slug: 'penthouse-residence',
    name: 'Penthouse Residence',
    tagline: 'Two floors. One skyline. Zero compromises.',
    description:
      'A split-level residence with private terrace, plunge pool and dedicated host. The address every headliner asks for.',
    sizeSqFt: 2400,
    maxGuests: 6,
    bedType: '2 Kings + Bunk',
    nightlyRate: 1450,
    amenities: ['Private terrace', 'Plunge pool', 'Dedicated host', 'Chef’s kitchen'],
    image: img('room-penthouse', 'Penthouse terrace overlooking the city'),
  },
];

export const venues: Venue[] = [
  {
    _id: 'venue-amp-room',
    _path: `${DAM}/venues/amp-room`,
    slug: 'amp-room',
    name: 'Amp Room',
    cuisine: 'Live music · Cocktails',
    description:
      'A 400-capacity listening room with a rotating lineup, craft cocktails and shareable plates.',
    priceTier: 2,
    hours: 'Daily 5pm – 2am',
    reservationsRequired: false,
    image: img('venue-amp', 'Live band on a moody stage'),
  },
  {
    _id: 'venue-smoke-anvil',
    _path: `${DAM}/venues/smoke-anvil`,
    slug: 'smoke-anvil',
    name: 'Smoke & Anvil',
    cuisine: 'Steakhouse · Wood-fire',
    description: 'Dry-aged cuts over oak and cherry wood, with a cellar of 600 labels.',
    priceTier: 4,
    hours: 'Nightly 5pm – 11pm',
    reservationsRequired: true,
    image: img('venue-smoke', 'Wood-fire grill and steaks'),
  },
  {
    _id: 'venue-velvet-noodle',
    _path: `${DAM}/venues/velvet-noodle`,
    slug: 'velvet-noodle',
    name: 'Velvet Noodle',
    cuisine: 'Pan-Asian · Late night',
    description: 'Hand-pulled noodles, bao and a ramen bar that stays open after the last encore.',
    priceTier: 2,
    hours: 'Daily 11am – 4am',
    reservationsRequired: false,
    image: img('venue-noodle', 'Steaming noodle bowls at a bar'),
  },
  {
    _id: 'venue-sunrise-social',
    _path: `${DAM}/venues/sunrise-social`,
    slug: 'sunrise-social',
    name: 'Sunrise Social',
    cuisine: 'Café · Bakery',
    description:
      'Single-origin espresso, laminated pastries and a sun-drenched patio for slow mornings.',
    priceTier: 1,
    hours: 'Daily 6am – 3pm',
    reservationsRequired: false,
    image: img('venue-sunrise', 'Sunny café patio with pastries'),
  },
];

/** Physical inventory per room type (units the hotel owns). Not authorable content. */
export const INVENTORY: Record<string, number> = {
  'room-skyline-king': 40,
  'room-double-platinum': 30,
  'room-stage-suite': 12,
  'room-penthouse-residence': 2,
};
