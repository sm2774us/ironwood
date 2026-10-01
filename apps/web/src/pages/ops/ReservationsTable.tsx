import type { Reservation, ReservationListQuery, ReservationStatus } from '@ironwood/shared';
import { useQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { opsQueries } from '@/features/ops/queries';
import { formatCents, formatRange } from '@/lib/format';

const PAGE_SIZE = 8;
const col = createColumnHelper<Reservation>();
const STATUS_VARIANT = {
  confirmed: 'success',
  checked_in: 'default',
  pending: 'warning',
  cancelled: 'destructive',
} as const;
const SORTABLE: Record<string, ReservationListQuery['sort']> = {
  guest: 'guest',
  checkIn: 'checkIn',
  totalCents: 'totalCents',
  status: 'status',
};

const columns = [
  col.accessor('id', { header: 'Booking', enableSorting: false }),
  col.accessor((r) => `${r.guest.lastName}, ${r.guest.firstName}`, {
    id: 'guest',
    header: 'Guest',
  }),
  col.accessor('roomName', { header: 'Suite', enableSorting: false }),
  col.accessor('checkIn', {
    id: 'checkIn',
    header: 'Stay',
    cell: (c) => formatRange(c.row.original.checkIn, c.row.original.checkOut),
  }),
  col.accessor('totalCents', { header: 'Total', cell: (c) => formatCents(c.getValue()) }),
  col.accessor('status', {
    header: 'Status',
    cell: (c) => (
      <Badge variant={STATUS_VARIANT[c.getValue()]}>{c.getValue().replace('_', ' ')}</Badge>
    ),
  }),
];

export default function ReservationsTable() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'checkIn', desc: true }]);
  const [pageIndex, setPageIndex] = useState(0);
  const [status, setStatus] = useState<ReservationStatus | ''>('');
  const [q, setQ] = useState('');
  const deferredQ = useDeferredValue(q);
  const sort = sorting[0];

  const query = useQuery(
    opsQueries.reservations({
      page: pageIndex + 1,
      pageSize: PAGE_SIZE,
      sort: SORTABLE[sort?.id ?? 'checkIn'] ?? 'checkIn',
      order: sort?.desc === false ? 'asc' : 'desc',
      status: status || undefined,
      q: deferredQ || undefined,
    }),
  );
  const total = query.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const table = useReactTable({
    data: query.data?.items ?? [],
    columns,
    state: { sorting, pagination: { pageIndex, pageSize: PAGE_SIZE } },
    manualSorting: true,
    manualPagination: true,
    enableSortingRemoval: false,
    rowCount: total,
    onSortingChange: (u) => {
      setSorting(u);
      setPageIndex(0);
    },
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div className="grid gap-2">
          <Label htmlFor="res-search">Search</Label>
          <Input
            id="res-search"
            type="search"
            placeholder="Guest, booking or suite"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPageIndex(0);
            }}
            className="w-64"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="res-status">Status</Label>
          <Select
            id="res-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ReservationStatus | '');
              setPageIndex(0);
            }}
            className="w-44"
          >
            <option value="">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked in</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
        <p role="status" className="ml-auto text-sm text-muted-foreground">
          {query.isFetching ? 'Updating…' : `${total} reservations`}
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <caption className="sr-only">Reservations. Use column header buttons to sort.</caption>
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const dir = h.column.getIsSorted();
                  return (
                    <th
                      key={h.id}
                      scope="col"
                      className="px-4 py-3 font-medium"
                      aria-sort={
                        dir === 'asc'
                          ? 'ascending'
                          : dir === 'desc'
                            ? 'descending'
                            : h.column.getCanSort()
                              ? 'none'
                              : undefined
                      }
                    >
                      {h.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={h.column.getToggleSortingHandler()}
                          className="inline-flex min-h-11 items-center gap-1 rounded-sm"
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {dir === 'asc' ? (
                            <ArrowUp className="size-3.5" aria-hidden />
                          ) : dir === 'desc' ? (
                            <ArrowDown className="size-3.5" aria-hidden />
                          ) : (
                            <ArrowUpDown className="size-3.5 opacity-50" aria-hidden />
                          )}
                        </button>
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className={query.isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
            {table.getRowModel().rows.map((r) => (
              <tr key={r.id} className="border-t">
                {r.getVisibleCells().map((c) => (
                  <td key={c.id} className="px-4 py-3">
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {!query.isLoading && total === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No reservations match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <nav aria-label="Pagination" className="mt-4 flex items-center justify-end gap-3">
        <span className="text-sm text-muted-foreground">
          Page {pageIndex + 1} of {pageCount}
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous page"
          disabled={pageIndex === 0}
          onClick={() => setPageIndex((p) => p - 1)}
        >
          <ChevronLeft aria-hidden />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next page"
          disabled={pageIndex + 1 >= pageCount}
          onClick={() => setPageIndex((p) => p + 1)}
        >
          <ChevronRight aria-hidden />
        </Button>
      </nav>
      {query.isError && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          Couldn’t load reservations. Retrying…
        </p>
      )}
    </div>
  );
}
