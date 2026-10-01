import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { Suspense, type ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Button } from '@/components/ui/button';

/**
 * Fault isolation per section: a failing query degrades only its own region (with retry),
 * never the whole page. Suspense gives each section an independent, layout-stable skeleton.
 */
export function QuerySection({
  children,
  fallback,
  label,
}: {
  children: ReactNode;
  fallback: ReactNode;
  label: string;
}) {
  const { reset } = useQueryErrorResetBoundary();
  return (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ resetErrorBoundary }) => (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-6"
        >
          <p className="flex items-center gap-2 font-medium">
            <AlertTriangle className="size-4 text-destructive" aria-hidden /> We couldn’t load{' '}
            {label}.
          </p>
          <Button variant="outline" size="sm" onClick={resetErrorBoundary}>
            Try again
          </Button>
        </div>
      )}
    >
      <Suspense fallback={fallback}>{children}</Suspense>
    </ErrorBoundary>
  );
}
