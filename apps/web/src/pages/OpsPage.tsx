import { useSuspenseQuery } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { QuerySection } from '@/components/QuerySection';
import { opsQueries } from '@/features/ops/queries';
import { formatCents } from '@/lib/format';

// Heavy widgets are split into their own chunks and streamed in after the page shell.
const RevenueChart = lazy(() => import('./ops/RevenueChart'));
const ReservationsTable = lazy(() => import('./ops/ReservationsTable'));

function Stats() {
  const { data } = useSuspenseQuery(opsQueries.stats());
  const t = data.totals;
  const items = [
    ['Active reservations', String(t.reservations)],
    ['Booked revenue', formatCents(t.revenueCents)],
    ['Average daily rate', formatCents(t.adrCents)],
    ['14-day occupancy', `${t.occupancyPct}%`],
  ] as const;
  return (
    <>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(([k, v]) => (
          <Card key={k} className="p-5">
            <dt className="text-sm text-muted-foreground">{k}</dt>
            <dd className="mt-1 font-display text-3xl">{v}</dd>
          </Card>
        ))}
      </dl>
      <Suspense fallback={<Skeleton className="mt-8 h-72 w-full" />}>
        <RevenueChart daily={data.daily} />
      </Suspense>
    </>
  );
}

export default function OpsPage() {
  return (
    <div className="container py-12">
      <h1 className="text-4xl">Operations console</h1>
      <p className="mb-8 mt-2 text-muted-foreground">
        Server-side sorting, filtering and pagination over the reservations API.
      </p>
      <QuerySection label="performance stats" fallback={<Skeleton className="h-32 w-full" />}>
        <Stats />
      </QuerySection>
      <section aria-labelledby="res-h" className="mt-10">
        <h2 id="res-h" className="mb-4 text-2xl">
          Reservations
        </h2>
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <ReservationsTable />
        </Suspense>
      </section>
    </div>
  );
}
