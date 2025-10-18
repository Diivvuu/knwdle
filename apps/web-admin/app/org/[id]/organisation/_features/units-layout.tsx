'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/store';
import {
  fetchOrgUnitsTree,
  fetchOrgUnits,
  deleteOrgUnit,
} from '@workspace/state';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';
import {
  LayoutList,
  Network,
  Plus,
  X,
  Pencil,
  Trash2,
  Loader2,
  Search,
} from 'lucide-react';
import DataTableClean from '@workspace/ui/components/data-table';
import { Input } from '@workspace/ui/components/input';
import { Badge } from '@workspace/ui/components/badge';
import { cn } from '@workspace/ui/lib/utils';
import { toast } from 'sonner';
import { useCreateUnitModal } from '@/features/org-unit/use-org-unit-atom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import { useConfirmDialog } from '@/features/confirm/use-confirm-dialog';
import ConfirmDialog from '@/features/confirm/confirm-dialog';

interface UnitsLayoutProps {
  orgId: string;
}

export default function UnitsLayout({ orgId }: UnitsLayoutProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [createState, setCreateState] = useCreateUnitModal();
  const [query, setQuery] = useState('');

  // fetch data
  useEffect(() => {
    dispatch(fetchOrgUnitsTree(orgId));
    dispatch(fetchOrgUnits(orgId));
  }, [dispatch, orgId]);

  const unitsTree = useSelector(
    (s: RootState) => s.orgUnit.unitsTreeByOrg[orgId]
  );
  const unitsFlat = useSelector((s: RootState) => s.orgUnit.unitsByOrg[orgId]);

  // map for parent names
  const parentNameMap = useMemo(() => {
    const all = unitsFlat?.items ?? [];
    return all.reduce(
      (acc, u) => ({ ...acc, [u.id]: u.name }),
      {} as Record<string, string>
    );
  }, [unitsFlat]);

  // search handlers
  const handleSearch = useCallback((val: string) => {
    setQuery(val.trim().toLowerCase());
  }, []);

  // filter tree by query (keeps ancestors for context)
  const filteredTree = useMemo(() => {
    const source = unitsTree?.data ?? [];
    if (!query) return source;

    const match = (name: string) => name?.toLowerCase().includes(query);

    const dfs = (nodes: any[]): any[] => {
      return nodes
        .map((n) => {
          const kids = dfs(n.children ?? []);
          if (match(n.name) || kids.length) {
            return { ...n, children: kids };
          }
          return null;
        })
        .filter(Boolean);
    };

    return dfs(source);
  }, [unitsTree, query]);

  // filtered table rows
  const tableRows = useMemo(() => {
    const rows = unitsFlat?.items ?? [];
    if (!query) return rows;
    return rows.filter((r: any) => {
      const hay =
        `${r.name ?? ''} ${r.code ?? ''} ${r.type ?? ''} ${parentNameMap[r.parentId] ?? ''}`.toLowerCase();
      return hay.includes(query);
    });
  }, [unitsFlat, parentNameMap, query]);

  // keyboard: close drawer on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    if (drawerOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  return (
    <>
      <ConfirmDialog />
      <div className="flex flex-col h-full w-full">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b bg-gradient-to-r from-background via-primary/5 to-background">
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />

          <div className="flex items-center gap-3">
            <div className="relative">
              <Input
                placeholder="Search units…"
                className="w-48 sm:w-64 pl-9"
                onChange={(e) => handleSearch(e.target.value)}
              />
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <Button onClick={() => setCreateState({ orgId })} className="gap-2">
              <Plus className="h-4 w-4" /> Add Unit
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {viewMode === 'tree' ? (
              <motion.div
                key="tree-view"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                className="flex-1 overflow-y-auto"
              >
                <TreePanel
                  data={filteredTree}
                  onSelect={(id) => {
                    setSelectedUnit(id);
                    setDrawerOpen(true);
                  }}
                  activeId={selectedUnit}
                  emptyLabel={query ? 'No matching units.' : 'No units found.'}
                />
              </motion.div>
            ) : (
              <motion.div
                key="table-view"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                className="flex-1 overflow-y-auto"
              >
                <UnitsTablePanel
                  rows={tableRows}
                  parentNameMap={parentNameMap}
                  onRowSelect={(id) => {
                    setSelectedUnit(id);
                    setDrawerOpen(true);
                  }}
                  loading={unitsFlat?.status === 'loading'}
                  emptyText={query ? 'No matching units.' : 'No units yet.'}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Drawer */}
          <AnimatePresence>
            {drawerOpen && selectedUnit && (
              <motion.aside
                key="drawer"
                initial={{ x: 420, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 420, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                className="w-[384px] shrink-0 bg-background/95 backdrop-blur-xl border-l shadow-xl overflow-y-auto"
              >
                <UnitDetailDrawer
                  unitId={selectedUnit}
                  parentNameMap={parentNameMap}
                  onClose={() => setDrawerOpen(false)}
                  onEdit={() => {
                    // You’ll paste your edit dialog wiring here:
                    // setCreateState({ orgId, mode: 'edit', unitId: selectedUnit })
                    toast.info('Edit dialog wiring comes next.');
                  }}
                  onDeleted={() => {
                    setDrawerOpen(false);
                    setSelectedUnit(null);
                  }}
                  orgId={orgId}
                />
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

/* --------------------------- sub components --------------------------- */

function ViewToggle({
  viewMode,
  setViewMode,
}: {
  viewMode: 'tree' | 'table';
  setViewMode: (v: 'tree' | 'table') => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-border/40 bg-card text-card-foreground overflow-hidden">
      <Button
        variant={viewMode === 'tree' ? 'default' : 'ghost'}
        className={cn(
          'rounded-none text-sm gap-1',
          viewMode === 'tree' && 'shadow-sm'
        )}
        onClick={() => setViewMode('tree')}
      >
        <Network className="h-4 w-4" />
        Tree
      </Button>
      <Button
        variant={viewMode === 'table' ? 'default' : 'ghost'}
        className={cn(
          'rounded-none text-sm gap-1 border-l border-border/40',
          viewMode === 'table' && 'shadow-sm'
        )}
        onClick={() => setViewMode('table')}
      >
        <LayoutList className="h-4 w-4" />
        Table
      </Button>
    </div>
  );
}

function TreePanel({
  data,
  onSelect,
  activeId,
  emptyLabel,
}: {
  data: any[];
  onSelect: (id: string) => void;
  activeId?: string | null;
  emptyLabel: string;
}) {
  if (!data?.length) {
    return (
      <div className="p-6 text-sm text-muted-foreground">{emptyLabel}</div>
    );
  }

  return (
    <ul className="p-3 sm:p-4 space-y-1">
      {data.map((unit) => (
        <li key={unit.id}>
          <button
            onClick={() => onSelect(unit.id)}
            className={cn(
              'w-full text-left px-3 py-2 rounded-md hover:bg-primary/10 text-sm font-medium transition-colors',
              activeId === unit.id && 'bg-primary/15 text-primary'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate">{unit.name}</span>
              {unit.type ? (
                <Badge variant="secondary" className="ml-2">
                  {unit.type}
                </Badge>
              ) : null}
            </div>
          </button>
          {unit.children?.length ? (
            <div className="ml-4 border-l pl-3">
              <TreePanel
                data={unit.children}
                onSelect={onSelect}
                activeId={activeId}
                emptyLabel={emptyLabel}
              />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function UnitsTablePanel({
  rows,
  parentNameMap,
  onRowSelect,
  loading,
  emptyText,
}: {
  rows: any[];
  parentNameMap: Record<string, string>;
  onRowSelect: (unitId: string) => void;
  loading?: boolean;
  emptyText: string;
}) {
  const columns = [
    { key: 'name', header: 'Unit Name', render: (r: any) => r.name },
    { key: 'code', header: 'Code', render: (r: any) => r.code ?? '—' },
    {
      key: 'parentId',
      header: 'Parent Unit',
      render: (r: any) => parentNameMap[r.parentId] ?? '—',
    },
    { key: 'type', header: 'Type', render: (r: any) => r.type ?? '—' },
    {
      key: 'membersCount',
      header: 'Members',
      render: (r: any) => r._count?.members ?? 0,
    },
    {
      key: 'createdAt',
      header: 'Created At',
      render: (r: any) =>
        new Date(r.createdAt).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
    },
    {
      key: 'updatedAt',
      header: 'Last Updated',
      render: (r: any) =>
        r.updatedAt
          ? new Date(r.updatedAt).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : '—',
    },
  ];

  return (
    <DataTableClean
      title="Units"
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      ui={{ zebra: true, border: true, stickyHeader: true }}
      onRowClick={(r) => onRowSelect(r.id)}
      loading={loading}
      empty={<div className="text-sm text-muted-foreground">{emptyText}</div>}
    />
  );
}

function UnitDetailDrawer({
  unitId,
  parentNameMap,
  onClose,
  onEdit,
  onDeleted,
  orgId,
}: {
  unitId: string;
  parentNameMap: Record<string, string>;
  onClose: () => void;
  onEdit: () => void;
  onDeleted: () => void;
  orgId: string;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const { confirm } = useConfirmDialog();
  const [deleting, setDeleting] = useState(false);

  const unit = useSelector((s: RootState) =>
    Object.values(s.orgUnit.unitsByOrg)
      .flatMap((o: any) => o.items ?? [])
      .find((u: any) => u.id === unitId)
  );

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteOrgUnit({ orgId, unitId })).unwrap();
      toast.success(`Deleted ${unit?.name ?? 'unit'}`);

      // ✅ Force UI refresh after delete
      await Promise.all([
        dispatch(fetchOrgUnits(orgId)),
        dispatch(fetchOrgUnitsTree(orgId)),
      ]);

      // ✅ Close drawer and notify parent list
      onDeleted();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete unit');
    } finally {
      setDeleting(false);
    }
  };

  if (!unit) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Unit not found.</div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* header & content same as before ... */}

      <div className="p-4 flex gap-2">
        <Button variant="outline" className="gap-2" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Edit
        </Button>

        <Button
          variant="destructive"
          className="gap-2"
          disabled={deleting}
          onClick={() =>
            confirm({
              title: 'Delete this unit?',
              description: (
                <>
                  This action cannot be undone. The unit <b>{unit.name}</b> will
                  be permanently removed.
                </>
              ),
              confirmText: 'Delete',
              cancelText: 'Cancel',
              onConfirm: handleDelete,
            })
          }
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Delete
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px,1fr] gap-2">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium break-words">{value}</span>
    </div>
  );
}
