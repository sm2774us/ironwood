import type { QueryClient } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  type ErrorComponentProps,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Link,
} from '@tanstack/react-router';
import { defaultStay, parseStaySearch } from '@/lib/stay';
import { contentQueries } from '@/features/content/queries';
import { availabilityQuery } from '@/features/booking/queries';
import { opsQueries } from '@/features/ops/queries';
import { Button } from '@/components/ui/button';
import { PageSkeleton, RootLayout } from './RootLayout';

interface RouterContext {
  queryClient: QueryClient;
}

const NotFound = () => (
  <div className="container grid place-items-center gap-4 py-32 text-center">
    <h1 className="text-4xl">Page not found</h1>
    <p className="text-muted-foreground">The page you’re looking for has checked out.</p>
    <Button asChild>
      <Link to="/">Back to home</Link>
    </Button>
  </div>
);

const RouteError = ({ error, reset }: ErrorComponentProps) => (
  <div role="alert" className="container grid place-items-center gap-4 py-32 text-center">
    <h1 className="text-3xl">Something went wrong</h1>
    <p className="text-muted-foreground">
      {error instanceof Error ? error.message : 'Unexpected error'}
    </p>
    <Button onClick={reset}>Try again</Button>
  </div>
);

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
  errorComponent: RouteError,
});

// Loaders only *kick off* prefetches (never awaited): the lazy route chunk and its data then load
// in parallel instead of as a request waterfall, without blocking navigation on a slow API.
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  loader: ({ context: { queryClient: qc } }) => {
    void qc.prefetchQuery(contentQueries.hero());
    void qc.prefetchQuery(contentQueries.offers());
  },
  component: lazyRouteComponent(() => import('@/pages/HomePage')),
});

const stayRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stay',
  validateSearch: parseStaySearch,
  loader: ({ context: { queryClient: qc } }) => {
    void qc.prefetchQuery(contentQueries.rooms());
    void qc.prefetchQuery(availabilityQuery(defaultStay()));
  },
  component: lazyRouteComponent(() => import('@/pages/StayPage')),
});

const diningRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dining',
  loader: ({ context: { queryClient: qc } }) => void qc.prefetchQuery(contentQueries.venues()),
  component: lazyRouteComponent(() => import('@/pages/DiningPage')),
});

const bookRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/book',
  validateSearch: (
    raw: Record<string, unknown>,
  ): { roomId?: string; checkIn?: string; checkOut?: string; guests?: number } => ({
    ...parseStaySearch(raw),
    ...(typeof raw['roomId'] === 'string' ? { roomId: raw['roomId'] } : {}),
  }),
  component: lazyRouteComponent(() => import('@/pages/BookPage')),
});

// Heavy (table + chart) — lives in its own chunk and is only fetched when an operator navigates here.
const opsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ops',
  loader: ({ context: { queryClient: qc } }) => void qc.prefetchQuery(opsQueries.stats()),
  component: lazyRouteComponent(() => import('@/pages/OpsPage')),
});

const showcaseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/showcase',
  component: lazyRouteComponent(() => import('@/pages/ShowcasePage')),
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  stayRoute,
  diningRoute,
  bookRoute,
  opsRoute,
  showcaseRoute,
]);

export const createAppRouter = (queryClient: QueryClient) =>
  createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: PageSkeleton,
    defaultPendingMs: 200,
    scrollRestoration: true,
  });

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
