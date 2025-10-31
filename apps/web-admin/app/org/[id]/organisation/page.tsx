


// File: page.tsx
'use client';
import { AppDispatch, RootState } from '@/store/store';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';

import { useCreateUnitModal } from '@/features/org-unit/use-org-unit-atom';

import { Button } from '@workspace/ui/components/button';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchOrgTree, fetchOrgUnits, OrgUnitType } from '@workspace/state';
import { Label } from '@workspace/ui/components/label';
import DataTableClean from '@workspace/ui/components/data-table';
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover';
import { Badge } from '@workspace/ui/components/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@workspace/ui/components/tabs';
import OrgGraphView from './_components/org-graph-view';

type OrgUnit = {
  id: string;
  name: string;
  type: OrgUnitType;
  orgId: string;
  parentId: string | null;
  meta: Record<string, any> | null;
  features: any;
  createdAt: string;
  updatedAt: string;
  children?: OrgUnit[];
};

const OrganisationPage = () => {
  const params = useParams();
  const orgId = params.id as string;

  const dispatch = useDispatch<AppDispatch>();

  const [open, setOpen] = useCreateUnitModal();
  const tree = useSelector((state: RootState) => state.orgUnit.tree);
  const treeStatus = useSelector(
    (state: RootState) => state.orgUnit.treeStatus
  );

  const units = useSelector((state: RootState) => state.orgUnit.list);
  const unitsStatus = useSelector(
    (state: RootState) => state.orgUnit.listStatus
  );

  const [activeTab, setActiveTab] = useState<'graph' | 'table'>('graph');
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    dispatch(fetchOrgUnits(orgId));
    dispatch(fetchOrgTree(orgId));
  }, [orgId, dispatch]);

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (unit: OrgUnit) => unit.name,
    },
    {
      key: 'type',
      header: 'Type',
      render: (unit: OrgUnit) => unit.type,
    },
    {
      key: 'createdAt',
      header: 'Created At',
      render: (unit: OrgUnit) => new Date(unit.createdAt).toLocaleString(),
    },
    {
      key: 'updatedAt',
      header: 'Updated At',
      render: (unit: OrgUnit) => new Date(unit.updatedAt).toLocaleString(),
    },
   {
  key: 'features',
  header: 'Features',
  render: (unit: OrgUnit) => {
    const features = unit.features || {};
    const enabled = Object.entries(features)
      .filter(([_, v]) => v)
      .map(([k]) => k);

    if (enabled.length === 0)
      return <span className="text-xs text-muted-foreground">—</span>;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Badge variant="outline" className="cursor-pointer">
            {enabled.length} enabled
          </Badge>
        </PopoverTrigger>
        <PopoverContent className="p-2 text-xs w-[180px]">
          <div className="font-medium mb-1 text-foreground/80">Enabled Features</div>
          <ul className="list-disc pl-4 space-y-0.5">
            {enabled.map((f) => (
              <li key={f} className="text-muted-foreground">{f}</li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    );
  },
}
  ];

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pt-4">
        <div>
          <Label className="text-2xl font-semibold tracking-tight">
            Organisation Units
          </Label>
          {/* <p className="text-sm text-muted-foreground">
            Send and manage invitations for this organisation.
          </p> */}
        </div>
        <div className="flex items-center gap-2">
          <Button className="rounded-md" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Unit
          </Button>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'graph' | 'table')}>
        <TabsList>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="graph">Graph</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          <DataTableClean<OrgUnit>
            title=""
            columns={columns}
            rows={units}
            rowKey={(r) => r.id}
            loading={unitsStatus === 'loading'}
            toolbarActions={
              <Button onClick={() => dispatch(fetchOrgUnits(orgId))}>
                Refresh
              </Button>
            }
          />
        </TabsContent>
        <TabsContent value="graph">
          <OrgGraphView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrganisationPage;
