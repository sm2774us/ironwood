import {
  addDays,
  nightsBetween,
  toISODate,
  type AvailabilityItem,
  type OpsStats,
  type Reservation,
  type ReservationListQuery,
  type ReservationPage,
  type ReservationRequest,
  type ReservationStatus,
  type Room,
} from '@ironwood/shared';
import { INVENTORY } from '../data/seed';
import { conflict } from '../lib/errors';
import { mulberry32 } from '../lib/prng';

const ACTIVE: ReservationStatus[] = ['pending', 'confirmed', 'checked_in'];
const TAX_RATE = 0.135;
const RESORT_FEE_CENTS = 3500;

const isWeekend = (iso: string): boolean => {
  const d = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return d === 5 || d === 6;
};

export const nightlyCents = (room: Room, date: string): number =>
  Math.round(room.nightlyRate * 100 * (isWeekend(date) ? 1.25 : 1));

const FIRST = [
  'Ava',
  'Liam',
  'Noah',
  'Mia',
  'Zoe',
  'Ethan',
  'Isla',
  'Kai',
  'Nora',
  'Theo',
  'Luna',
  'Omar',
  'Priya',
  'Mateo',
];
const LAST = [
  'Reyes',
  'Khan',
  'Nguyen',
  'Silva',
  'Ortiz',
  'Patel',
  'Becker',
  'Okafor',
  'Rossi',
  'Kim',
  'Haddad',
  'Moreau',
];

export class ReservationStore {
  private items: Reservation[] = [];
  private idempotent = new Map<string, Reservation>();
  private seq = 1000;

  constructor(
    private readonly getRooms: () => Room[],
    private readonly now: () => Date,
  ) {
    this.seed();
  }

  private seed(): void {
    const rnd = mulberry32(42);
    const rooms = this.getRooms();
    const today = toISODate(this.now());
    const statuses: ReservationStatus[] = [
      'confirmed',
      'confirmed',
      'confirmed',
      'pending',
      'cancelled',
    ];
    for (let i = 0; i < 64; i += 1) {
      const room = rooms[Math.floor(rnd() * rooms.length)] as Room;
      const checkIn = addDays(today, Math.floor(rnd() * 28) - 8);
      const nights = 1 + Math.floor(rnd() * 5);
      const checkOut = addDays(checkIn, nights);
      let status = statuses[Math.floor(rnd() * statuses.length)] as ReservationStatus;
      if (status !== 'cancelled' && checkIn <= today && checkOut > today) status = 'checked_in';
      const fn = FIRST[Math.floor(rnd() * FIRST.length)] as string;
      const ln = LAST[Math.floor(rnd() * LAST.length)] as string;
      const quote = this.quote(room, checkIn, checkOut);
      this.seq += 1;
      this.items.push({
        id: `IW-${this.seq}`,
        roomId: room._id,
        roomName: room.name,
        checkIn,
        checkOut,
        nights,
        guests: 1 + Math.floor(rnd() * room.maxGuests),
        guest: { firstName: fn, lastName: ln, email: `${fn}.${ln}@example.com`.toLowerCase() },
        status,
        totalCents: quote.totalCents,
        createdAt: new Date(
          this.now().getTime() - Math.floor(rnd() * 20) * 86_400_000,
        ).toISOString(),
      });
    }
  }

  private quote(room: Room, checkIn: string, checkOut: string) {
    const nights = nightsBetween(checkIn, checkOut);
    let subtotalCents = 0;
    for (let i = 0; i < nights; i += 1) subtotalCents += nightlyCents(room, addDays(checkIn, i));
    const taxesCents = Math.round(subtotalCents * TAX_RATE);
    const feesCents = RESORT_FEE_CENTS * nights;
    return {
      nights,
      subtotalCents,
      taxesCents,
      feesCents,
      totalCents: subtotalCents + taxesCents + feesCents,
    };
  }

  private unitsLeft(roomId: string, checkIn: string, checkOut: string): number {
    const capacity = INVENTORY[roomId] ?? 0;
    const nights = nightsBetween(checkIn, checkOut);
    let min = capacity;
    for (let i = 0; i < nights; i += 1) {
      const date = addDays(checkIn, i);
      const taken = this.items.filter(
        (r) =>
          r.roomId === roomId &&
          ACTIVE.includes(r.status) &&
          r.checkIn <= date &&
          date < r.checkOut,
      ).length;
      min = Math.min(min, capacity - taken);
    }
    return Math.max(0, min);
  }

  availability(
    rooms: Room[],
    checkIn: string,
    checkOut: string,
    guests: number,
  ): AvailabilityItem[] {
    return rooms.map((room) => {
      const q = this.quote(room, checkIn, checkOut);
      const unitsLeft = this.unitsLeft(room._id, checkIn, checkOut);
      const fitsParty = guests <= room.maxGuests;
      return {
        roomId: room._id,
        slug: room.slug,
        nights: q.nights,
        unitsLeft,
        fitsParty,
        available: fitsParty && unitsLeft > 0,
        nightlyAverageCents: Math.round(q.subtotalCents / q.nights),
        subtotalCents: q.subtotalCents,
        taxesCents: q.taxesCents,
        feesCents: q.feesCents,
        totalCents: q.totalCents,
      };
    });
  }

  /** Idempotent create: a retried POST with the same key returns the original reservation. */
  create(
    req: ReservationRequest,
    room: Room,
    idempotencyKey: string,
  ): { reservation: Reservation; replayed: boolean } {
    const prior = this.idempotent.get(idempotencyKey);
    if (prior) return { reservation: prior, replayed: true };
    if (req.guests > room.maxGuests)
      throw conflict(`${room.name} sleeps up to ${room.maxGuests} guests`);
    if (this.unitsLeft(room._id, req.checkIn, req.checkOut) < 1) {
      throw conflict(`${room.name} is sold out for those dates`);
    }
    const q = this.quote(room, req.checkIn, req.checkOut);
    this.seq += 1;
    const reservation: Reservation = {
      id: `IW-${this.seq}`,
      roomId: room._id,
      roomName: room.name,
      checkIn: req.checkIn,
      checkOut: req.checkOut,
      nights: q.nights,
      guests: req.guests,
      guest: req.guest,
      status: 'confirmed',
      totalCents: q.totalCents,
      createdAt: this.now().toISOString(),
    };
    this.items.unshift(reservation);
    this.idempotent.set(idempotencyKey, reservation);
    return { reservation, replayed: false };
  }

  list(query: ReservationListQuery): ReservationPage {
    const q = query.q?.toLowerCase();
    let rows = this.items.filter(
      (r) =>
        (!query.status || r.status === query.status) &&
        (!q ||
          `${r.id} ${r.guest.firstName} ${r.guest.lastName} ${r.roomName}`
            .toLowerCase()
            .includes(q)),
    );
    const dir = query.order === 'asc' ? 1 : -1;
    const key = (r: Reservation): string | number =>
      query.sort === 'guest' ? `${r.guest.lastName} ${r.guest.firstName}` : r[query.sort];
    rows = [...rows].sort((a, b) => (key(a) > key(b) ? dir : key(a) < key(b) ? -dir : 0));
    const start = (query.page - 1) * query.pageSize;
    return {
      items: rows.slice(start, start + query.pageSize),
      total: rows.length,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  stats(rooms: Room[], days = 14): OpsStats {
    const today = toISODate(this.now());
    const totalUnits = Object.values(INVENTORY).reduce((a, b) => a + b, 0);
    const byId = new Map(rooms.map((r) => [r._id, r]));
    const daily = Array.from({ length: days }, (_, i) => {
      const date = addDays(today, i);
      let occupiedUnits = 0;
      let revenueCents = 0;
      for (const r of this.items) {
        if (!ACTIVE.includes(r.status) || !(r.checkIn <= date && date < r.checkOut)) continue;
        occupiedUnits += 1;
        const room = byId.get(r.roomId);
        if (room) revenueCents += nightlyCents(room, date);
      }
      return { date, occupiedUnits, totalUnits, revenueCents };
    });
    const active = this.items.filter((r) => ACTIVE.includes(r.status));
    const revenueCents = active.reduce((s, r) => s + r.totalCents, 0);
    const nights = active.reduce((s, r) => s + r.nights, 0);
    const occ = daily.reduce((s, d) => s + d.occupiedUnits, 0) / (totalUnits * days);
    return {
      totals: {
        reservations: active.length,
        revenueCents,
        adrCents: nights ? Math.round(revenueCents / nights) : 0,
        occupancyPct: Math.round(occ * 1000) / 10,
      },
      daily,
    };
  }
}
