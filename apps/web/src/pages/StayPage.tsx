import { stayQuerySchema } from '@ironwood/shared';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { Search } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { analytics } from '@/analytics';
import { CardGridSkeleton, RoomCard } from '@/components/cards';
import { QuerySection } from '@/components/QuerySection';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { availabilityQuery } from '@/features/booking/queries';
import { contentQueries } from '@/features/content/queries';
import { resolveStay } from '@/lib/stay';

const route = getRouteApi('/stay');

function SearchForm() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const stay = resolveStay(search);
  const [form, setForm] = useState({ ...stay, guests: String(stay.guests) });
  const [error, setError] = useState<string>();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = stayQuerySchema.safeParse(form);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Check your dates');
    setError(undefined);
    analytics.track('availability_search', { nights: 0, guests: parsed.data.guests });
    void navigate({ search: parsed.data });
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid gap-4 rounded-lg border bg-card p-5 sm:grid-cols-[1fr_1fr_8rem_auto] sm:items-end"
      aria-label="Search availability"
    >
      <div className="grid gap-2">
        <Label htmlFor="checkIn">Check-in</Label>
        <Input
          id="checkIn"
          type="date"
          value={form.checkIn}
          onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
          aria-invalid={!!error}
          aria-describedby={error ? 'stay-error' : undefined}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="checkOut">Check-out</Label>
        <Input
          id="checkOut"
          type="date"
          value={form.checkOut}
          onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
          aria-invalid={!!error}
          aria-describedby={error ? 'stay-error' : undefined}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="guests">Guests</Label>
        <Select
          id="guests"
          value={form.guests}
          onChange={(e) => setForm({ ...form, guests: e.target.value })}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit">
        <Search aria-hidden />
        Search
      </Button>
      {error && (
        <p id="stay-error" role="alert" className="text-sm text-destructive sm:col-span-4">
          {error}
        </p>
      )}
    </form>
  );
}

function Results() {
  const stay = resolveStay(route.useSearch());
  const { data: rooms } = useSuspenseQuery(contentQueries.rooms());
  // Content (GraphQL/AEM) and availability (REST) load independently and are joined client-side by id.
  const availability = useQuery(availabilityQuery(stay));
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState<'recommended' | 'low' | 'high'>('recommended');

  const rows = useMemo(() => {
    const byId = new Map(availability.data?.map((a) => [a.roomId, a]));
    let out = rooms.map((room) => ({ room, a: byId.get(room._id) }));
    if (onlyAvailable) out = out.filter((r) => r.a?.available);
    if (sort !== 'recommended')
      out = [...out].sort(
        (x, y) => ((x.a?.totalCents ?? 0) - (y.a?.totalCents ?? 0)) * (sort === 'low' ? 1 : -1),
      );
    return out;
  }, [rooms, availability.data, onlyAvailable, sort]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          {availability.isFetching
            ? 'Checking availability…'
            : `${rows.length} ${rows.length === 1 ? 'suite' : 'suites'} for ${stay.guests} ${stay.guests === 1 ? 'guest' : 'guests'}`}
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch
              id="only-available"
              checked={onlyAvailable}
              onCheckedChange={setOnlyAvailable}
            />
            <Label htmlFor="only-available">Available only</Label>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="sort">Sort</Label>
            <Select
              id="sort"
              className="w-44"
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
            >
              <option value="recommended">Recommended</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </Select>
          </div>
        </div>
      </div>
      {availability.isError && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          Live availability is unavailable right now — showing “from” rates.
        </p>
      )}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map(({ room, a }) => (
          <RoomCard key={room._id} room={room} availability={a} reserveHref={stay} />
        ))}
      </div>
    </div>
  );
}

export default function StayPage() {
  return (
    <div className="container py-12">
      <h1 className="text-4xl">Find your suite</h1>
      <p className="mb-8 mt-2 text-muted-foreground">
        Live availability and taxes, merged with authored room content.
      </p>
      <SearchForm />
      <div className="mt-10">
        <QuerySection label="suites" fallback={<CardGridSkeleton count={4} />}>
          <Results />
        </QuerySection>
      </div>
    </div>
  );
}
