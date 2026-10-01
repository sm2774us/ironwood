import type { OpsStats } from '@ironwood/shared';
import { formatCents, formatDate } from '@/lib/format';

/** Dependency-free SVG chart: ships ~1 kB instead of a charting library, with an accessible data table. */
export default function RevenueChart({ daily }: { daily: OpsStats['daily'] }) {
  const W = 720,
    H = 240,
    pad = 28;
  const max = Math.max(...daily.map((d) => d.totalUnits), 1);
  const bw = (W - pad * 2) / daily.length;
  const peak = daily.reduce(
    (a, d) => (d.occupiedUnits > a.occupiedUnits ? d : a),
    daily[0] as OpsStats['daily'][number],
  );
  return (
    <figure className="mt-8 rounded-lg border bg-card p-5">
      <figcaption className="mb-3 text-lg font-display">Occupied rooms, next 14 days</figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Bar chart of occupied rooms per night. Peak is ${peak.occupiedUnits} of ${peak.totalUnits} on ${formatDate(peak.date)}.`}
        className="w-full"
      >
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line
            key={g}
            x1={pad}
            x2={W - pad}
            y1={H - pad - g * (H - pad * 2)}
            y2={H - pad - g * (H - pad * 2)}
            className="stroke-border"
            strokeDasharray="3 4"
          />
        ))}
        {daily.map((d, i) => {
          const h = (d.occupiedUnits / max) * (H - pad * 2);
          return (
            <g key={d.date}>
              <rect
                x={pad + i * bw + 4}
                y={H - pad - h}
                width={bw - 8}
                height={h}
                rx={3}
                className="fill-primary"
              />
              <text
                x={pad + i * bw + bw / 2}
                y={H - 8}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {formatDate(d.date, { day: 'numeric' })}
              </text>
            </g>
          );
        })}
      </svg>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted-foreground">View data table</summary>
        <table className="mt-2 w-full text-left">
          <caption className="sr-only">Nightly occupancy and revenue</caption>
          <thead>
            <tr>
              <th scope="col">Night</th>
              <th scope="col">Occupied</th>
              <th scope="col">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {daily.map((d) => (
              <tr key={d.date}>
                <td>{formatDate(d.date)}</td>
                <td>
                  {d.occupiedUnits}/{d.totalUnits}
                </td>
                <td>{formatCents(d.revenueCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
