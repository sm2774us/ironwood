import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { CardGridSkeleton, VenueCard } from '@/components/cards';
import { QuerySection } from '@/components/QuerySection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { contentQueries } from '@/features/content/queries';

type Filter = 'all' | 'reserve' | 'walkin';

function Venues() {
  const { data } = useSuspenseQuery(contentQueries.venues());
  const [filter, setFilter] = useState<Filter>('all');
  const shown = data.filter(
    (v) => filter === 'all' || (filter === 'reserve') === v.reservationsRequired,
  );
  return (
    <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
      <TabsList aria-label="Filter venues">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="reserve">Reservations required</TabsTrigger>
        <TabsTrigger value="walkin">Walk-ins welcome</TabsTrigger>
      </TabsList>
      <TabsContent value={filter}>
        <p className="sr-only" role="status">
          {shown.length} venues shown
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((v) => (
            <VenueCard key={v._id} venue={v} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}

export default function DiningPage() {
  return (
    <div className="container py-12">
      <h1 className="text-4xl">Dining &amp; entertainment</h1>
      <p className="mb-8 mt-2 max-w-2xl text-muted-foreground">
        Content is delivered through persisted GraphQL queries from the headless content layer.
      </p>
      <QuerySection label="venues" fallback={<CardGridSkeleton />}>
        <Venues />
      </QuerySection>
    </div>
  );
}
