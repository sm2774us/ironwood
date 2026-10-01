import { VITAL_THRESHOLDS, type VitalName } from '@ironwood/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { contentKeys } from '@/features/content/queries';
import { opsQueries, setChaos } from '@/features/ops/queries';
import { TRACEABILITY, type Area } from '@/features/showcase/traceability';
import { useAuthorStore } from '@/stores/author-store';
import { useVitalsStore } from '@/stores/vitals-store';

const AREAS: Array<Area | 'All'> = [
  'All',
  'Frontend',
  'AEM headless',
  'Quality & delivery',
  'Qualifications',
  'Nice to have',
];

function Traceability() {
  const [area, setArea] = useState<Area | 'All'>('All');
  const [q, setQ] = useState('');
  const rows = useMemo(
    () =>
      TRACEABILITY.filter(
        (t) =>
          (area === 'All' || t.area === area) &&
          `${t.requirement} ${t.implementation}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [area, q],
  );
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="grid gap-2">
          <Label htmlFor="trace-q">Filter requirements</Label>
          <Input
            id="trace-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-72"
            placeholder="e.g. LCP, Universal Editor"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Area">
          {AREAS.map((a) => (
            <Button
              key={a}
              size="sm"
              variant={a === area ? 'default' : 'outline'}
              aria-pressed={a === area}
              onClick={() => setArea(a)}
            >
              {a}
            </Button>
          ))}
        </div>
      </div>
      <p role="status" className="mb-4 text-sm text-muted-foreground">
        {rows.length} of {TRACEABILITY.length} requirements
      </p>
      <ul className="grid gap-4">
        {rows.map((t) => (
          <li key={t.requirement}>
            <Card className="grid gap-2 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{t.area}</Badge>
                <h3 className="font-sans text-base font-semibold">{t.requirement}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{t.implementation}</p>
              <p className="flex flex-wrap gap-2 text-xs">
                {t.evidence.map((e) => (
                  <code key={e} className="rounded bg-muted px-1.5 py-0.5">
                    {e}
                  </code>
                ))}
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

const RATING_VARIANT = {
  good: 'success',
  'needs-improvement': 'warning',
  poor: 'destructive',
} as const;
const fmt = (n: VitalName, v: number) => (n === 'CLS' ? v.toFixed(3) : `${Math.round(v)} ms`);

function Vitals() {
  const local = useVitalsStore((s) => s.latest);
  const server = useQuery(opsQueries.vitals());
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section aria-labelledby="v-local">
        <h3 id="v-local" className="mb-3 text-xl">
          This session (live)
        </h3>
        <ul className="grid gap-2">
          {(Object.keys(VITAL_THRESHOLDS) as VitalName[]).map((n) => {
            const s = local[n];
            return (
              <li key={n} className="flex items-center justify-between rounded-md border p-3">
                <span className="font-medium">{n}</span>
                {s ? (
                  <span className="flex items-center gap-3">
                    {fmt(n, s.value)}
                    <Badge variant={RATING_VARIANT[s.rating]}>{s.rating}</Badge>
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">waiting for interaction…</span>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          LCP/CLS finalise when the page is hidden or navigated away; INP needs an interaction.
        </p>
      </section>
      <section aria-labelledby="v-rum">
        <h3 id="v-rum" className="mb-3 text-xl">
          All visitors (p75, from API)
        </h3>
        <ul className="grid gap-2">
          {(Object.keys(VITAL_THRESHOLDS) as VitalName[]).map((n) => {
            const s = server.data?.[n];
            return (
              <li key={n} className="flex items-center justify-between rounded-md border p-3">
                <span className="font-medium">{n}</span>
                {s ? (
                  <span className="flex items-center gap-3">
                    {fmt(n, s.p75)}{' '}
                    <span className="text-xs text-muted-foreground">n={s.count}</span>
                    <Badge variant={RATING_VARIANT[s.rating]}>{s.rating}</Badge>
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">no samples yet</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function ResilienceLab() {
  const qc = useQueryClient();
  const status = useQuery(opsQueries.resilience());
  const chaos = useMutation({
    mutationFn: setChaos,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['ops', 'resilience'] }),
  });
  const reload = () => void qc.invalidateQueries({ queryKey: contentKeys.all });
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="grid gap-4 p-6">
        <h3 className="text-xl">Upstream fault injection</h3>
        <p className="text-sm text-muted-foreground">
          Simulate the AEM content tier failing. The API retries with backoff, trips a circuit
          breaker, then serves last-known-good content flagged with <code>x-content-stale</code>.
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Failure rate">
          {[0, 0.5, 1].map((r) => (
            <Button
              key={r}
              variant={status.data?.chaosRate === r ? 'default' : 'outline'}
              aria-pressed={status.data?.chaosRate === r}
              onClick={() => chaos.mutate(r)}
            >
              {r === 0 ? 'Healthy' : `${r * 100}% failures`}
            </Button>
          ))}
        </div>
        <Button variant="secondary" onClick={reload}>
          Reload content now
        </Button>
        {chaos.isError && (
          <p role="alert" className="text-sm text-destructive">
            {chaos.error.message}
          </p>
        )}
      </Card>
      <Card className="grid gap-3 p-6" role="status" aria-live="polite">
        <h3 className="text-xl">Live status</h3>
        <p>
          Failure rate: <strong>{status.data ? `${status.data.chaosRate * 100}%` : '…'}</strong>
        </p>
        <p>
          Circuit breaker:{' '}
          <Badge variant={status.data?.breaker === 'closed' ? 'success' : 'destructive'}>
            {status.data?.breaker ?? '…'}
          </Badge>
        </p>
        <p className="text-sm text-muted-foreground">
          Open the{' '}
          <Link to="/" className="underline">
            home page
          </Link>{' '}
          while failing: content keeps rendering and a banner explains why.
        </p>
      </Card>
    </div>
  );
}

function AuthorLab() {
  const enabled = useAuthorStore((s) => s.enabled);
  const setEnabled = useAuthorStore((s) => s.setEnabled);
  return (
    <Card className="grid gap-4 p-6">
      <h3 className="text-xl">In-context authoring</h3>
      <p className="text-sm text-muted-foreground">
        Every authored string carries Universal Editor <code>data-aue-*</code> attributes. Turn on
        author mode, then click any dashed element on the home, stay or dining pages to edit its
        content fragment live.
      </p>
      <div className="flex items-center gap-3">
        <Switch id="author" checked={enabled} onCheckedChange={setEnabled} />
        <Label htmlFor="author">Author mode</Label>
      </div>
      <Button asChild className="w-fit">
        <Link to="/">Go edit the home page</Link>
      </Button>
    </Card>
  );
}

export default function ShowcasePage() {
  return (
    <div className="container py-12">
      <h1 className="text-4xl">Engineering showcase</h1>
      <p className="mb-8 mt-2 max-w-3xl text-muted-foreground">
        Every line of the Senior Frontend Engineer job description, mapped to working code in this
        repository — plus live performance and resilience instrumentation.
      </p>
      <Tabs defaultValue="trace">
        <TabsList aria-label="Showcase sections">
          <TabsTrigger value="trace">JD traceability</TabsTrigger>
          <TabsTrigger value="vitals">Web Vitals</TabsTrigger>
          <TabsTrigger value="resilience">Resilience lab</TabsTrigger>
          <TabsTrigger value="author">Authoring</TabsTrigger>
        </TabsList>
        <TabsContent value="trace">
          <Traceability />
        </TabsContent>
        <TabsContent value="vitals">
          <Vitals />
        </TabsContent>
        <TabsContent value="resilience">
          <ResilienceLab />
        </TabsContent>
        <TabsContent value="author">
          <AuthorLab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
