import { Link } from '@tanstack/react-router';
import { Moon, Sun, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useResilienceStore } from '@/stores/resilience-store';
import { useUiStore } from '@/stores/ui-store';

export const SkipLink = () => (
  <a
    href="#main"
    className="sr-only-focusable fixed left-4 top-4 z-[100] rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground"
  >
    Skip to main content
  </a>
);

const NAV = [
  { to: '/stay', label: 'Stay' },
  { to: '/dining', label: 'Dining' },
  { to: '/ops', label: 'Ops console' },
  { to: '/showcase', label: 'Engineering' },
] as const;

export function Header() {
  const theme = useUiStore((s) => s.theme);
  const toggle = useUiStore((s) => s.toggleTheme);
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="container flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2">
        <Link
          to="/"
          className="font-display text-xl font-semibold tracking-[0.25em]"
          aria-label="Ironwood Resorts — home"
        >
          IRON<span className="text-primary">WOOD</span>
        </Link>
        <nav
          aria-label="Primary"
          className="order-3 -mx-2 flex w-full gap-1 overflow-x-auto sm:order-none sm:mx-0 sm:w-auto"
        >
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              preload="intent"
              className="flex min-h-11 items-center rounded-md px-3 text-sm text-muted-foreground hover:text-foreground"
              activeProps={{ className: 'text-foreground font-semibold', 'aria-current': 'page' }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? <Sun aria-hidden /> : <Moon aria-hidden />}
        </Button>
      </div>
    </header>
  );
}

export function StaleBanner() {
  const stale = useResilienceStore((s) => s.stale);
  if (!stale) return null;
  return (
    <div
      role="status"
      className="border-b border-primary/40 bg-primary/10 py-2 text-center text-sm"
    >
      <WifiOff className="mr-2 inline size-4" aria-hidden />
      Showing saved content while our content service recovers. Pricing and availability are still
      live.
    </div>
  );
}

export const Footer = () => (
  <footer className="mt-24 border-t py-10 text-sm text-muted-foreground">
    <div className="container flex flex-wrap items-center justify-between gap-4">
      <p>
        © {new Date().getFullYear()} Ironwood Resorts — a fictional brand built as an engineering
        showcase.
      </p>
      <p>
        <Link to="/showcase" className="underline underline-offset-4 hover:text-foreground">
          How this was built
        </Link>
      </p>
    </div>
  </footer>
);
