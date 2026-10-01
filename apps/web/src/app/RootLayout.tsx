import { Outlet, useRouterState } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { analytics } from '@/analytics';
import { AuthorToolbar } from '@/components/AuthorToolbar';
import { Footer, Header, SkipLink, StaleBanner } from '@/components/layout';
import { Skeleton } from '@/components/ui/skeleton';

const TITLES: Record<string, string> = {
  '/': 'Ironwood Resorts',
  '/stay': 'Suites & availability',
  '/dining': 'Dining & entertainment',
  '/book': 'Reserve your suite',
  '/ops': 'Operations console',
  '/showcase': 'Engineering showcase',
};

/** SPA a11y: on navigation, update the title, move focus to <main> and announce the new page. */
function useRouteAnnouncer(mainRef: React.RefObject<HTMLElement>) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const first = useRef(true);
  useEffect(() => {
    const title = TITLES[pathname] ?? 'Page not found';
    document.title = pathname === '/' ? title : `${title} · Ironwood Resorts`;
    analytics.track('page_view', { path: pathname, title });
    if (first.current) {
      first.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [pathname, mainRef]);
  return pathname;
}

export function RootLayout() {
  const mainRef = useRef<HTMLElement>(null);
  const pathname = useRouteAnnouncer(mainRef);
  return (
    <>
      <SkipLink />
      <StaleBanner />
      <Header />
      <main id="main" ref={mainRef} tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <AuthorToolbar />
      <div aria-live="polite" className="sr-only" role="status">
        {`Navigated to ${TITLES[pathname] ?? 'page'}`}
      </div>
    </>
  );
}

export const PageSkeleton = () => (
  <div className="container py-16" aria-busy="true" aria-label="Loading page">
    <Skeleton className="mb-6 h-10 w-1/3" />
    <Skeleton className="h-64 w-full" />
  </div>
);
