import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initAnalytics } from '@/analytics';
import { reportWebVitals } from '@/analytics/vitals';
import { makeQueryClient, Providers } from '@/app/providers';
import { createAppRouter } from '@/app/router';
import { installUniversalEditor, isInIframe } from '@/lib/aem';
import { useAuthorStore } from '@/stores/author-store';
import { useUiStore } from '@/stores/ui-store';
import './index.css';

const queryClient = makeQueryClient();
const router = createAppRouter(queryClient);

// Built-in author mode: `?author=1` (never inside the real Universal Editor iframe, which brings its own UI).
useAuthorStore
  .getState()
  .setEnabled(new URLSearchParams(location.search).get('author') === '1' && !isInIframe());
void useUiStore.persist.rehydrate();
installUniversalEditor();
initAnalytics();

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Providers client={queryClient}>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);

// After first render: measure real-user vitals off the critical path.
if ('requestIdleCallback' in window) requestIdleCallback(() => void reportWebVitals());
else setTimeout(() => void reportWebVitals(), 1500);
