'use client';
import * as React from 'react';
import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@workspace/ui/components/table';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ChevronDown, ChevronUp, Search, RefreshCw } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';

/* ---------------------------------- types --------------------------------- */

export type SortDir = 'asc' | 'desc';
export type Density = 'comfortable' | 'compact';

export type Column<T> = {
  key: string;
  header: string | React.ReactNode;
  width?: string | number;
  align?: 'left' | 'right' | 'center';
  // set true to allow sorting
  sortable?: boolean;
  // returns primitive/string/number used for sorting (optional; falls back to rendered text if not provided)
  sortAccessor?: (row: T) => string | number | null | undefined;
  // custom cell renderer
  render: (row: T) => React.ReactNode;
};

export type FilterDef =
  | {
      type: 'select';
      key: string;
      label: string;
      options: Array<{ label: string; value: string }>;
    }
  | {
      type: 'text';
      key: string;
      label: string;
      placeholder?: string;
    };

type ServerHandlers = {
  // called whenever any of: page, pageSize, query, sort, filters change
  onQueryChange?: (q: {
    page: number;
    pageSize: number;
    query: string;
    sort?: { key: string; dir: SortDir } | null;
    filters: Record<string, string>;
  }) => void;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (r: T) => string;

  /* UX / chrome */
  title?: string;
  toolbarActions?: React.ReactNode; // right-aligned actions in toolbar
  density?: Density;

  /* table state (controlled or uncontrolled) */
  initialQuery?: string;
  initialSort?: { key: string; dir: SortDir } | null;
  initialFilters?: Record<string, string>;
  initialPage?: number;
  initialPageSize?: number;

  // pagination display; for client mode derive it from rows; for server mode pass total from backend
  totalCount?: number;

  // server mode handlers (if provided, table becomes controlled/driver)
  handlers?: ServerHandlers;

  // filters config
  filters?: FilterDef[];

  /* visuals */
  loading?: boolean;
  errorText?: string;
  empty?: React.ReactNode;

  /* right-side per-row actions */
  rightActionsFor?: (r: T) => React.ReactNode;

  /* misc */
  className?: string;
  onRefresh?: () => void;
};

/* --------------------------------- utils ---------------------------------- */

function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function defaultSort<T>(
  arr: T[],
  accessor: (x: T) => string | number | null | undefined,
  dir: SortDir
) {
  const s = [...arr].sort((a, b) => {
    const va = accessor(a);
    const vb = accessor(b);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === 'number' && typeof vb === 'number') {
      return va - vb;
    }
    return String(va).localeCompare(String(vb));
  });
  return dir === 'asc' ? s : s.reverse();
}

/* -------------------------------- component -------------------------------- */

export default function DataTable<T>({
  columns,
  rows,
  rowKey,

  title,
  toolbarActions,
  density = 'comfortable',

  initialQuery = '',
  initialSort = null,
  initialFilters = {},
  initialPage = 1,
  initialPageSize = 10,

  totalCount,
  handlers,
  filters = [],

  loading,
  errorText,
  empty,
  rightActionsFor,

  className,
  onRefresh,
}: Props<T>) {
  const serverMode = Boolean(handlers?.onQueryChange);

  // state
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounced(query, 250);

  const [sort, setSort] = useState<typeof initialSort>(initialSort);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [filterState, setFilterState] =
    useState<Record<string, string>>(initialFilters);

  // announce to server
  useEffect(() => {
    if (!serverMode) return;
    handlers!.onQueryChange?.({
      page,
      pageSize,
      query: debouncedQuery,
      sort: sort ?? null,
      filters: filterState,
    });
  }, [serverMode, handlers, page, pageSize, debouncedQuery, sort, filterState]);

  // client-mode derived data
  const processed = useMemo(() => {
    if (serverMode) return rows;

    let output = [...rows];

    // client filters
    for (const f of filters) {
      const val = filterState[f.key];
      if (!val) continue;
      output = output.filter((r: any) => {
        if (f.type === 'text') {
          return JSON.stringify(r).toLowerCase().includes(val.toLowerCase());
        } else {
          // select
          return JSON.stringify(r).toLowerCase().includes(val.toLowerCase());
        }
      });
    }

    // client search
    const q = debouncedQuery.trim().toLowerCase();
    if (q) {
      output = output.filter((r) =>
        JSON.stringify(r).toLowerCase().includes(q)
      );
    }

    // client sort
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortable) {
        const accessor =
          col.sortAccessor ??
          ((row: any) => {
            // fallback: try to stringify the rendered content
            const rendered = col.render(row);
            if (typeof rendered === 'string' || typeof rendered === 'number')
              return rendered;
            return (row as any)[col.key] ?? null;
          });
        output = defaultSort(output, accessor, sort.dir);
      }
    }

    return output;
  }, [rows, serverMode, filters, filterState, debouncedQuery, sort, columns]);

  // pagination (client mode compute; server mode relies on totalCount prop)
  const clientTotal = processed.length;
  const effectiveTotal = serverMode ? (totalCount ?? rows.length) : clientTotal;

  const paged = useMemo(() => {
    if (serverMode) return rows;
    const start = (page - 1) * pageSize;
    return processed.slice(start, start + pageSize);
  }, [processed, page, pageSize, serverMode, rows]);

  // header sorting toggle
  function toggleSort(col: Column<T>) {
    if (!col.sortable) return;
    setPage(1);
    setSort((prev) => {
      if (!prev || prev.key !== col.key) return { key: col.key, dir: 'asc' };
      if (prev.dir === 'asc') return { key: col.key, dir: 'desc' };
      return null;
    });
  }

  const densityRowClass =
    density === 'compact' ? 'h-9 text-sm' : 'h-12 text-sm md:text-[15px]';

  return (
    <div className={cn('w-full', className)}>
      {/* toolbar */}
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          {title ? <div className="text-base font-medium">{title}</div> : null}
          {errorText ? (
            <Badge variant="destructive" className="ml-2">
              {errorText}
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* filters */}
          {filters.map((f) => {
            if (f.type === 'select') {
              return (
                <select
                  key={f.key}
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  value={filterState[f.key] ?? ''}
                  onChange={(e) =>
                    setFilterState((s) => ({ ...s, [f.key]: e.target.value }))
                  }
                >
                  <option value="">{f.label}</option>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              );
            }
            // text
            return (
              <Input
                key={f.key}
                placeholder={f.placeholder ?? f.label}
                className="h-9 w-[200px]"
                value={filterState[f.key] ?? ''}
                onChange={(e) =>
                  setFilterState((s) => ({ ...s, [f.key]: e.target.value }))
                }
              />
            );
          })}

          {/* search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8 h-9 w-[220px]"
              placeholder="Search…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* refresh */}
          {onRefresh ? (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          ) : null}

          {/* external actions */}
          {toolbarActions}
        </div>
      </div>

      {/* table wrapper for x-scroll */}
      <div className="relative w-full overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader className="sticky top-0 z-[1] bg-card">
            <TableRow className="hover:bg-transparent">
              {columns.map((c) => {
                const active = sort?.key === c.key;
                const icon =
                  active && sort?.dir === 'asc' ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : active && sort?.dir === 'desc' ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : null;
                return (
                  <TableHead
                    key={c.key}
                    style={{
                      width: c.width,
                      textAlign: c.align,
                      cursor: c.sortable ? 'pointer' : 'default',
                    }}
                    onClick={() => toggleSort(c)}
                    className={cn(
                      'select-none',
                      c.sortable && 'hover:bg-muted/40 transition-colors',
                      active && 'text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <span className="whitespace-nowrap">{c.header}</span>
                      {icon}
                    </div>
                  </TableHead>
                );
              })}
              {rightActionsFor ? (
                <TableHead className="text-right">Actions</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* loading skeletons */}
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  <TableCell
                    colSpan={columns.length + (rightActionsFor ? 1 : 0)}
                  >
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : (serverMode ? rows.length === 0 : paged.length === 0) ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (rightActionsFor ? 1 : 0)}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  {empty ?? 'No data.'}
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence initial={false}>
                {(serverMode ? rows : paged).map((r) => {
                  const id = rowKey(r);
                  return (
                    <motion.tr
                      key={id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className={cn(
                        'border-b bg-background/40',
                        densityRowClass,
                        'hover:bg-muted/40 transition-colors'
                      )}
                    >
                      {columns.map((c) => (
                        <TableCell
                          key={`${id}-${c.key}`}
                          style={{ textAlign: c.align }}
                          className="align-middle"
                        >
                          {c.render(r)}
                        </TableCell>
                      ))}
                      {rightActionsFor ? (
                        <TableCell className="text-right align-middle">
                          {rightActionsFor(r)}
                        </TableCell>
                      ) : null}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>

      {/* footer / pagination */}
      <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-xs text-muted-foreground">
          {loading
            ? 'Loading…'
            : `Showing ${
                serverMode ? rows.length : paged.length
              } of ${effectiveTotal} item(s)`}
        </div>

        <div className="flex items-center gap-2">
          {/* density */}
          <div className="hidden md:flex items-center gap-1 text-xs">
            <span className="text-muted-foreground mr-1">Density</span>
            <Badge
              variant={density === 'comfortable' ? 'default' : 'outline'}
              className="cursor-default"
            >
              Comfortable
            </Badge>
            <span> / </span>
            <Badge
              variant={density === 'compact' ? 'default' : 'outline'}
              className="cursor-default"
            >
              Compact
            </Badge>
          </div>

          {/* page size */}
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={pageSize}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value, 10));
              setPage(1);
            }}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>

          {/* pager */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              Prev
            </Button>
            <div className="px-2 text-sm tabular-nums">{page}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={
                loading ||
                (serverMode
                  ? rows.length < pageSize
                  : page * pageSize >= processed.length)
              }
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
