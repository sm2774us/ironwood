import { reservationRequestSchema, type Reservation } from '@ironwood/shared';
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { getRouteApi, Link } from '@tanstack/react-router';
import { CheckCircle2 } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { analytics } from '@/analytics';
import { QuerySection } from '@/components/QuerySection';
import { ResponsiveImage } from '@/components/ResponsiveImage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { availabilityQuery, bookingKeys, createReservation } from '@/features/booking/queries';
import { contentQueries } from '@/features/content/queries';
import { ApiError } from '@/lib/api';
import { formatCents, formatRange } from '@/lib/format';
import { resolveStay } from '@/lib/stay';
import { useBookingStore } from '@/stores/booking-store';

const route = getRouteApi('/book');

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function Confirmation({ reservation }: { reservation: Reservation }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <Card className="grid gap-4 p-8 text-center" role="status">
      <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden />
      <h1 ref={ref} tabIndex={-1} className="text-3xl">
        You’re booked!
      </h1>
      <p>
        Confirmation <strong data-testid="confirmation-id">{reservation.id}</strong>
      </p>
      <p className="text-muted-foreground">
        {reservation.roomName} · {formatRange(reservation.checkIn, reservation.checkOut)} ·{' '}
        {formatCents(reservation.totalCents, true)}
      </p>
      <Button asChild className="mx-auto">
        <Link to="/ops">See it in the ops console</Link>
      </Button>
    </Card>
  );
}

function BookingForm({ roomId }: { roomId: string }) {
  const search = route.useSearch();
  const stay = resolveStay(search);
  const qc = useQueryClient();
  const { data: rooms } = useSuspenseQuery(contentQueries.rooms());
  const { data: availability } = useQuery(availabilityQuery(stay));
  const room = rooms.find((r) => r._id === roomId);
  const quote = availability?.find((a) => a.roomId === roomId);

  const { guest, specialRequests, setGuest, setSpecialRequests, clear } = useBookingStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  // One idempotency key per booking attempt: safe to retry on flaky networks without double-booking.
  const idempotencyKey = useRef(crypto.randomUUID());

  const book = useMutation({
    mutationFn: () =>
      createReservation(
        reservationRequestSchema.parse({
          roomId,
          ...stay,
          guest,
          specialRequests: specialRequests || undefined,
        }),
        idempotencyKey.current,
      ),
    retry: (count, err) => !(err instanceof ApiError) && count < 2,
    onSuccess: (r) => {
      analytics.track('booking_completed', { room: r.roomName, totalCents: r.totalCents });
      clear();
      void qc.invalidateQueries({ queryKey: bookingKeys.availability });
      void qc.invalidateQueries({ queryKey: ['ops'] });
    },
  });

  if (!room)
    return (
      <p role="alert">
        That suite no longer exists.{' '}
        <Link to="/stay" className="underline">
          Choose another
        </Link>
        .
      </p>
    );
  if (book.isSuccess) return <Confirmation reservation={book.data} />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = reservationRequestSchema.safeParse({
      roomId,
      ...stay,
      guest,
      specialRequests: specialRequests || undefined,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const i of parsed.error.issues) next[i.path.join('.')] ??= i.message;
      setErrors(next);
      const first = Object.keys(next)[0]?.replace('guest.', '');
      requestAnimationFrame(() => document.getElementById(first ?? '')?.focus());
      return;
    }
    setErrors({});
    book.mutate();
  };

  const err = (k: string) => errors[k];
  const aria = (k: string) => ({
    'aria-invalid': !!err(k),
    'aria-describedby': err(k) ? `${k.replace('guest.', '')}-error` : undefined,
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
      <form onSubmit={submit} noValidate className="grid gap-5" aria-label="Guest details">
        <h1 className="text-3xl">Guest details</h1>
        {Object.keys(errors).length > 0 && (
          <p
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm"
          >
            Please fix the {Object.keys(errors).length} highlighted field(s).
          </p>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="firstName" label="First name" error={err('guest.firstName')}>
            <Input
              id="firstName"
              autoComplete="given-name"
              value={guest.firstName}
              onChange={(e) => setGuest({ firstName: e.target.value })}
              {...aria('guest.firstName')}
            />
          </Field>
          <Field id="lastName" label="Last name" error={err('guest.lastName')}>
            <Input
              id="lastName"
              autoComplete="family-name"
              value={guest.lastName}
              onChange={(e) => setGuest({ lastName: e.target.value })}
              {...aria('guest.lastName')}
            />
          </Field>
        </div>
        <Field id="email" label="Email" error={err('guest.email')}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={guest.email}
            onChange={(e) => setGuest({ email: e.target.value })}
            {...aria('guest.email')}
          />
        </Field>
        <Field id="requests" label="Special requests (optional)">
          <Textarea
            id="requests"
            value={specialRequests}
            maxLength={500}
            onChange={(e) => setSpecialRequests(e.target.value)}
          />
        </Field>
        {book.isError && (
          <p role="alert" className="text-sm text-destructive">
            {book.error.message}
          </p>
        )}
        <Button type="submit" disabled={book.isPending || quote?.available === false}>
          {book.isPending ? 'Confirming…' : 'Confirm reservation'}
        </Button>
      </form>

      <aside aria-label="Reservation summary">
        <Card className="sticky top-24 overflow-hidden">
          <div className="aspect-[3/2]">
            <ResponsiveImage image={room.image} sizes="384px" />
          </div>
          <div className="grid gap-3 p-5">
            <h2 className="text-xl">{room.name}</h2>
            <p className="text-sm text-muted-foreground">
              {formatRange(stay.checkIn, stay.checkOut)} · {stay.guests}{' '}
              {stay.guests === 1 ? 'guest' : 'guests'}
            </p>
            {quote ? (
              <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
                <dt>{quote.nights} nights</dt>
                <dd>{formatCents(quote.subtotalCents, true)}</dd>
                <dt>Taxes</dt>
                <dd>{formatCents(quote.taxesCents, true)}</dd>
                <dt>Resort fees</dt>
                <dd>{formatCents(quote.feesCents, true)}</dd>
                <dt className="border-t pt-2 font-semibold">Total</dt>
                <dd className="border-t pt-2 font-semibold">
                  {formatCents(quote.totalCents, true)}
                </dd>
              </dl>
            ) : (
              <Skeleton className="h-24 w-full" />
            )}
            {quote && !quote.available && (
              <p role="alert" className="text-sm text-destructive">
                This suite is unavailable for your dates.
              </p>
            )}
          </div>
        </Card>
      </aside>
    </div>
  );
}

export default function BookPage() {
  const { roomId } = route.useSearch();
  return (
    <div className="container py-12">
      {roomId ? (
        <QuerySection label="your reservation" fallback={<Skeleton className="h-96 w-full" />}>
          <BookingForm roomId={roomId} />
        </QuerySection>
      ) : (
        <p>
          No suite selected.{' '}
          <Link to="/stay" className="underline underline-offset-4">
            Find your suite
          </Link>
          .
        </p>
      )}
    </div>
  );
}
