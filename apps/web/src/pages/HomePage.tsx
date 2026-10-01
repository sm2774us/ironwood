import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { CardGridSkeleton, OfferCard, RoomCard, VenueCard } from '@/components/cards';
import { Editable } from '@/components/Editable';
import { QuerySection } from '@/components/QuerySection';
import { ResponsiveImage } from '@/components/ResponsiveImage';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ueComponentAttrs } from '@/lib/aem';
import { contentQueries } from '@/features/content/queries';

function Hero() {
  const { data: hero } = useSuspenseQuery(contentQueries.hero());
  return (
    <section
      className="relative isolate flex min-h-[72vh] items-end overflow-hidden"
      aria-labelledby="hero-title"
      {...ueComponentAttrs(hero, 'hero', 'Hero')}
    >
      {/* LCP element: eager, high fetch priority, preloaded in index.html, intrinsic size reserved. */}
      <div className="absolute inset-0 -z-10">
        <ResponsiveImage image={hero.image} priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>
      <div className="container pb-16 pt-40">
        {/* Transform-only entrance: animating opacity here would delay LCP paint of the text. */}
        <motion.div
          initial={{ y: 16 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-2xl"
        >
          <Editable
            model="hero"
            fragment={hero}
            prop="eyebrow"
            label="Eyebrow"
            className="text-sm font-semibold uppercase tracking-[0.2em] text-primary"
          >
            {hero.eyebrow}
          </Editable>
          <h1 id="hero-title" className="mt-3 text-4xl leading-tight sm:text-6xl">
            <Editable model="hero" fragment={hero} prop="title" label="Headline">
              {hero.title}
            </Editable>
          </h1>
          <Editable
            as="p"
            multiline
            model="hero"
            fragment={hero}
            prop="subtitle"
            label="Subtitle"
            className="mt-5 max-w-xl text-lg text-foreground/80"
          >
            {hero.subtitle}
          </Editable>
          <Button asChild size="default" className="mt-8">
            <Link to={hero.cta.href}>
              <Editable model="hero" fragment={hero} prop="cta.label" label="CTA label">
                {hero.cta.label}
              </Editable>
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

const HeroSkeleton = () => <Skeleton className="min-h-[72vh] w-full rounded-none" />;

function Offers() {
  const { data } = useSuspenseQuery(contentQueries.offers());
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((o) => (
        <OfferCard key={o._id} offer={o} />
      ))}
    </div>
  );
}
function Suites() {
  const { data } = useSuspenseQuery(contentQueries.rooms());
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {data.map((r) => (
        <RoomCard key={r._id} room={r} />
      ))}
    </div>
  );
}
function Dining() {
  const { data } = useSuspenseQuery(contentQueries.venues());
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {data.map((v) => (
        <VenueCard key={v._id} venue={v} />
      ))}
    </div>
  );
}

const Section = ({
  id,
  title,
  blurb,
  to,
  children,
}: {
  id: string;
  title: string;
  blurb: string;
  to: '/stay' | '/dining';
  children: React.ReactNode;
}) => (
  <section aria-labelledby={id} className="container mt-20">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 id={id} className="text-3xl">
          {title}
        </h2>
        <p className="mt-2 max-w-xl text-muted-foreground">{blurb}</p>
      </div>
      <Button asChild variant="ghost">
        <Link to={to}>
          View all <ArrowRight aria-hidden />
        </Link>
      </Button>
    </div>
    {children}
  </section>
);

export default function HomePage() {
  return (
    <>
      <QuerySection label="the hero" fallback={<HeroSkeleton />}>
        <Hero />
      </QuerySection>
      <Section
        id="offers"
        title="Offers worth the trip"
        blurb="Seasonal packages curated by our revenue team — editable live in author mode."
        to="/stay"
      >
        <QuerySection label="offers" fallback={<CardGridSkeleton />}>
          <Offers />
        </QuerySection>
      </Section>
      {/* Below-the-fold sections are separate Suspense islands: they never block the hero. */}
      <Section
        id="suites"
        title="Suites built for the encore"
        blurb="From sound-isolated kings to a two-storey penthouse."
        to="/stay"
      >
        <QuerySection label="suites" fallback={<CardGridSkeleton count={4} />}>
          <Suites />
        </QuerySection>
      </Section>
      <Section
        id="dining"
        title="Dine. Drink. Dance."
        blurb="Seven kitchens and a listening room, open late."
        to="/dining"
      >
        <QuerySection label="dining" fallback={<CardGridSkeleton count={4} />}>
          <Dining />
        </QuerySection>
      </Section>
    </>
  );
}
