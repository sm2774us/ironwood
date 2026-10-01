import type { AvailabilityItem, Offer, Room, Venue } from '@ironwood/shared';
import { Link } from '@tanstack/react-router';
import { motion } from 'motion/react';
import { Bed, Clock, Maximize2, Users } from 'lucide-react';
import { analytics } from '@/analytics';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ueComponentAttrs } from '@/lib/aem';
import { formatCents, formatUsd, priceTier } from '@/lib/format';
import { Editable } from './Editable';
import { ResponsiveImage } from './ResponsiveImage';

const CARD_SIZES = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw';

export function OfferCard({ offer }: { offer: Offer }) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      {...ueComponentAttrs(offer, 'offer', 'Offer')}
    >
      <Card className="flex h-full flex-col overflow-hidden">
        <div className="relative aspect-[3/2] overflow-hidden bg-muted">
          <ResponsiveImage image={offer.image} sizes={CARD_SIZES} />
          <Badge className="absolute left-3 top-3">
            <Editable model="offer" fragment={offer} prop="badge" label="Badge">
              {offer.badge}
            </Editable>
          </Badge>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <Editable
            as="h3"
            model="offer"
            fragment={offer}
            prop="title"
            label="Offer title"
            className="text-xl"
          >
            {offer.title}
          </Editable>
          <Editable
            as="p"
            multiline
            model="offer"
            fragment={offer}
            prop="summary"
            label="Offer summary"
            className="text-sm text-muted-foreground"
          >
            {offer.summary}
          </Editable>
          <p className="mt-auto text-xs text-muted-foreground">
            <Editable model="offer" fragment={offer} prop="validThrough" label="Validity">
              {offer.validThrough}
            </Editable>
          </p>
          <Button asChild variant="outline">
            <Link to="/stay" onClick={() => analytics.track('offer_click', { offer: offer._id })}>
              <Editable model="offer" fragment={offer} prop="ctaLabel" label="CTA label">
                {offer.ctaLabel}
              </Editable>
            </Link>
          </Button>
        </div>
      </Card>
    </motion.article>
  );
}

interface RoomCardProps {
  room: Room;
  availability?: AvailabilityItem | undefined;
  reserveHref?: { checkIn: string; checkOut: string; guests: number };
}

export function RoomCard({ room, availability, reserveHref }: RoomCardProps) {
  const soldOut = availability && !availability.available;
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      {...ueComponentAttrs(room, 'room', 'Room')}
    >
      <Card className="flex h-full flex-col overflow-hidden">
        <div className="aspect-[3/2] overflow-hidden bg-muted">
          <ResponsiveImage
            image={room.image}
            sizes={CARD_SIZES}
            className={soldOut ? 'grayscale' : ''}
          />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div>
            <Editable
              as="h3"
              model="room"
              fragment={room}
              prop="name"
              label="Room name"
              className="text-xl"
            >
              {room.name}
            </Editable>
            <Editable
              as="p"
              model="room"
              fragment={room}
              prop="tagline"
              label="Tagline"
              className="mt-1 text-sm text-muted-foreground"
            >
              {room.tagline}
            </Editable>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <li className="flex items-center gap-1">
              <Maximize2 aria-hidden className="size-3.5" />
              {room.sizeSqFt} sq ft
            </li>
            <li className="flex items-center gap-1">
              <Users aria-hidden className="size-3.5" />
              Sleeps {room.maxGuests}
            </li>
            <li className="flex items-center gap-1">
              <Bed aria-hidden className="size-3.5" />
              {room.bedType}
            </li>
          </ul>
          <div className="mt-auto flex items-end justify-between gap-3 pt-2">
            {availability ? (
              <div>
                <p className="text-2xl font-semibold">
                  {formatCents(availability.nightlyAverageCents)}
                  <span className="text-xs font-normal text-muted-foreground"> / night</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCents(availability.totalCents)} total incl. taxes &amp; fees
                </p>
                {availability.available && availability.unitsLeft <= 3 && (
                  <p className="mt-1 text-xs font-medium text-accent">
                    Only {availability.unitsLeft} left
                  </p>
                )}
              </div>
            ) : (
              <p className="text-2xl font-semibold">
                {formatUsd(room.nightlyRate)}
                <span className="text-xs font-normal text-muted-foreground"> from / night</span>
              </p>
            )}
            {reserveHref && availability ? (
              soldOut ? (
                <Badge variant="destructive">
                  {availability.fitsParty ? 'Sold out' : `Max ${room.maxGuests} guests`}
                </Badge>
              ) : (
                <Button asChild>
                  <Link
                    to="/book"
                    search={{ roomId: room._id, ...reserveHref }}
                    onClick={() => analytics.track('booking_started', { room: room.slug })}
                  >
                    Reserve<span className="sr-only"> {room.name}</span>
                  </Link>
                </Button>
              )
            ) : (
              <Button asChild variant="outline">
                <Link to="/stay">
                  See dates<span className="sr-only"> for {room.name}</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.article>
  );
}

export function VenueCard({ venue }: { venue: Venue }) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      {...ueComponentAttrs(venue, 'venue', 'Venue')}
    >
      <Card className="flex h-full flex-col overflow-hidden">
        <div className="aspect-[3/2] overflow-hidden bg-muted">
          <ResponsiveImage image={venue.image} sizes={CARD_SIZES} />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-5">
          <div className="flex items-start justify-between gap-2">
            <Editable
              as="h3"
              model="venue"
              fragment={venue}
              prop="name"
              label="Venue name"
              className="text-xl"
            >
              {venue.name}
            </Editable>
            <span
              className="text-sm text-muted-foreground"
              aria-label={`Price level ${venue.priceTier} of 4`}
            >
              {priceTier(venue.priceTier)}
            </span>
          </div>
          <Editable
            as="p"
            model="venue"
            fragment={venue}
            prop="cuisine"
            label="Cuisine"
            className="text-sm font-medium text-primary"
          >
            {venue.cuisine}
          </Editable>
          <Editable
            as="p"
            multiline
            model="venue"
            fragment={venue}
            prop="description"
            label="Description"
            className="text-sm text-muted-foreground"
          >
            {venue.description}
          </Editable>
          <p className="mt-auto flex items-center gap-1.5 pt-2 text-xs text-muted-foreground">
            <Clock aria-hidden className="size-3.5" />
            <Editable model="venue" fragment={venue} prop="hours" label="Hours">
              {venue.hours}
            </Editable>
            {venue.reservationsRequired && (
              <Badge variant="warning" className="ml-auto">
                Reservations required
              </Badge>
            )}
          </p>
        </div>
      </Card>
    </motion.article>
  );
}

export function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="aspect-[3/4] w-full" />
      ))}
    </div>
  );
}
