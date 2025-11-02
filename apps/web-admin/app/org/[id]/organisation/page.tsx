'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import { AppDispatch } from '@/store/store';
import { toast } from 'sonner';

import { useConfirmDialog } from '@/features/confirm/use-confirm-dialog';
import { useCreateUnitModal } from '@/features/org-unit/use-org-unit-atom';

import {
  fetchOrgUnits,
  fetchOrgTree,
  deleteOrgUnit,
  resetOrgUnitsState,
  selectOrgUnits,
  selectOrgUnitsStatus,
  OrgUnitType,
} from '@workspace/state';

import { Button } from '@workspace/ui/components/button';
import { Label } from '@workspace/ui/components/label';
import { Badge } from '@workspace/ui/components/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/popover';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@workspace/ui/components/tabs';
import DataTable from '@workspace/ui/components/data-table';
import { RowActions } from '@workspace/ui/components/row-actions';
import OrgGraphView from './_components/org-graph-view';
import { DotSquare, Plus, RefreshCw, Table } from 'lucide-react';

type OrgUnit = {
  id: string;
  name: string;
  type: OrgUnitType;
  orgId: string;
  parentId: string | null;
  meta: Record<string, any> | null;
  features: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
  children?: OrgUnit[];
};

export default function OrganisationPage() {
  const { id: orgId } = useParams<{ id: string }>() ?? {};
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { confirm } = useConfirmDialog();
  const [open, setOpen] = useCreateUnitModal();
  const [activeTab, setActiveTab] = useState<'graph' | 'table'>('graph');

  const units = useSelector(selectOrgUnits);
  const unitsStatus = useSelector(selectOrgUnitsStatus);

  // initial + reset
  useEffect(() => {
    if (!orgId) return;
    dispatch(fetchOrgUnits(orgId));
    dispatch(fetchOrgTree(orgId));
    return () => {
      dispatch(resetOrgUnitsState());
    };
  }, [orgId, dispatch]);

  const handleDelete = useCallback(
    (unit: OrgUnit) =>
      confirm({
        title: 'Delete unit?',
        description: (
          <>
            This will permanently delete <b>{unit.name}</b> ({unit.type}). This
            action cannot be undone.
          </>
        ),
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm: async () => {
          const res = await dispatch(deleteOrgUnit({ orgId, unitId: unit.id }));
          if ((res as any).error) toast.error('Failed to delete unit');
          else toast.success('Unit deleted');
        },
      }),
    [confirm, dispatch, orgId]
  );

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (u: OrgUnit) => (
        <span
          className="font-medium text-primary cursor-pointer hover:underline"
          onClick={() => router.push(`/org/${u.orgId}/unit/${u.id}`)}
        >
          {u.name}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (u: OrgUnit) => u.type,
    },
    {
      key: 'features',
      header: 'Features',
      render: (u: OrgUnit) => {
        const enabled = Object.entries(u.features || {})
          .filter(([_, v]) => v)
          .map(([k]) => k);
        if (!enabled.length)
          return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Badge variant="outline" className="cursor-pointer">
                {enabled.length} enabled
              </Badge>
            </PopoverTrigger>
            <PopoverContent className="p-2 text-xs w-[180px]">
              <div className="font-medium mb-1 text-foreground/80">
                Enabled Features
              </div>
              <ul className="list-disc pl-4 space-y-0.5">
                {enabled.map((f) => (
                  <li key={f} className="text-muted-foreground">
                    {f}
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (u: OrgUnit) => new Date(u.createdAt).toLocaleDateString(),
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      sortable: true,
      render: (u: OrgUnit) => new Date(u.updatedAt).toLocaleDateString(),
    },
  ];

  const isLoading = unitsStatus === 'loading';
  const isEmpty = !isLoading && (!units || units.length === 0);

  return (
    <div className="container mx-auto">
      {/* Header */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'graph' | 'table')}
        className='space-y-4'
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pt-4">
          <div>
            <Label className="text-2xl font-semibold tracking-tight">
              Organisation Units
            </Label>
            <p className="text-sm text-muted-foreground">
              Manage hierarchy and features for each organisational unit.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                dispatch(fetchOrgUnits(orgId));
                dispatch(fetchOrgTree(orgId));
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button className="rounded-md" onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Unit
            </Button>
            <TabsList>
              <TabsTrigger value="table">
                <Table />
              </TabsTrigger>
              <TabsTrigger value="graph">
                <DotSquare />
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Tabs */}

        <TabsContent value="table">
          {isEmpty ? (
            <div className="border border-dashed rounded-md p-10 text-center text-muted-foreground">
              No organisational units yet. Create one to get started.
            </div>
          ) : (
            <DataTable<OrgUnit>
              title=""
              columns={columns}
              rows={units}
              rowKey={(r) => r.id}
              loading={isLoading}
              rightActionsFor={(r) => (
                <RowActions
                  onView={() => router.push(`/org/${r.orgId}/unit/${r.id}`)}
                  onEdit={() => toast.info(`Edit ${r.name}`)}
                  onDelete={() => handleDelete(r)}
                />
              )}
              ui={{
                hideSearch: false,
                zebra: true,
                stickyHeader: true,
                rounded: 'xl',
                headerUppercase: true,
                compactHeader: true,
                border: true,
                showSearchButton: true,
                searchPlaceholder: 'Search units…',
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="graph">
          <OrgGraphView
            onNodeClick={(id) => router.push(`/org/${orgId}/unit/${id}`)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
