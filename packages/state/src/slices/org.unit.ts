// packages/state/src/slices/orgUnits.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../api';

/* ---------------------------------- Types --------------------------------- */

export type OrgUnitType =
  | 'ORGANISATION'
  | 'DEPARTMENT'
  | 'CLASS'
  | 'SECTION'
  | 'SUBJECT'
  | 'BATCH'
  | 'GROUP'
  | 'OTHER';

export type FeatureFlags = Record<
  | 'attendance'
  | 'assignments'
  | 'tests'
  | 'notes'
  | 'fees'
  | 'announcements'
  | 'content'
  | 'liveClass'
  | 'interactions',
  boolean
>;

export interface OrgUnit {
  id: string;
  name: string;
  type: OrgUnitType;
  orgId: string;
  parentId: string | null;
  meta: Record<string, any> | null;
  features: FeatureFlags;
  createdAt: string;
  updatedAt: string;
  children?: OrgUnit[];
}

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

/* --------------------------------- Thunks --------------------------------- */

// GET /api/orgs/:orgId/units
export const fetchOrgUnits = createAsyncThunk(
  'orgUnits/fetchList',
  async (orgId: string) => {
    const { data } = await api.get<OrgUnit[]>(`/api/orgs/${orgId}/units`);
    return data;
  }
);

// GET /api/orgs/:orgId/tree
export const fetchOrgTree = createAsyncThunk(
  'orgUnits/fetchTree',
  async (orgId: string) => {
    const { data } = await api.get<OrgUnit[]>(`/api/orgs/${orgId}/tree`);
    return data;
  }
);

// GET /api/orgs/:orgId/units/:unitId
export const fetchOrgUnit = createAsyncThunk(
  'orgUnits/fetchOne',
  async (p: { orgId: string; unitId: string }) => {
    const { data } = await api.get<OrgUnit>(
      `/api/orgs/${p.orgId}/units/${p.unitId}`
    );
    return data;
  }
);

// POST /api/orgs/:orgId/units
export const createOrgUnit = createAsyncThunk(
  'orgUnits/create',
  async (p: { orgId: string; body: Partial<OrgUnit> }) => {
    const { data } = await api.post<OrgUnit>(
      `/api/orgs/${p.orgId}/units`,
      p.body
    );
    return data;
  }
);

// PATCH /api/orgs/:orgId/units/:unitId
export const updateOrgUnit = createAsyncThunk(
  'orgUnits/update',
  async (p: { orgId: string; unitId: string; body: Partial<OrgUnit> }) => {
    const { data } = await api.patch<OrgUnit>(
      `/api/orgs/${p.orgId}/units/${p.unitId}`,
      p.body
    );
    return data;
  }
);

// DELETE /api/orgs/:orgId/units/:unitId
export const deleteOrgUnit = createAsyncThunk(
  'orgUnits/delete',
  async (p: { orgId: string; unitId: string }) => {
    await api.delete(`/api/orgs/${p.orgId}/units/${p.unitId}`);
    return p.unitId;
  }
);

/* ---------------------------------- Slice --------------------------------- */

interface OrgUnitsState {
  list: OrgUnit[];
  tree: OrgUnit[];
  selected?: OrgUnit | null;

  listStatus: Status;
  treeStatus: Status;
  selectedStatus: Status;
  mutateStatus: Status;
  error?: string | null;
}

const initialState: OrgUnitsState = {
  list: [],
  tree: [],
  selected: null,
  listStatus: 'idle',
  treeStatus: 'idle',
  selectedStatus: 'idle',
  mutateStatus: 'idle',
  error: null,
};

const orgUnitsSlice = createSlice({
  name: 'orgUnits',
  initialState,
  reducers: {
    resetOrgUnitsState(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (b) => {
    /* ---------------------------- List endpoints ---------------------------- */
    b.addCase(fetchOrgUnits.pending, (s) => {
      s.listStatus = 'loading';
    });
    b.addCase(fetchOrgUnits.fulfilled, (s, a) => {
      s.listStatus = 'succeeded';
      s.list = a.payload;
    });
    b.addCase(fetchOrgUnits.rejected, (s, a) => {
      s.listStatus = 'failed';
      s.error = a.error.message ?? 'Failed to load org units';
    });

    /* ----------------------------- Tree endpoint ---------------------------- */
    b.addCase(fetchOrgTree.pending, (s) => {
      s.treeStatus = 'loading';
    });
    b.addCase(fetchOrgTree.fulfilled, (s, a) => {
      s.treeStatus = 'succeeded';
      s.tree = a.payload;
    });
    b.addCase(fetchOrgTree.rejected, (s, a) => {
      s.treeStatus = 'failed';
      s.error = a.error.message ?? 'Failed to load org unit tree';
    });

    /* ----------------------------- Single unit ------------------------------ */
    b.addCase(fetchOrgUnit.pending, (s) => {
      s.selectedStatus = 'loading';
    });
    b.addCase(fetchOrgUnit.fulfilled, (s, a) => {
      s.selectedStatus = 'succeeded';
      s.selected = a.payload;
    });
    b.addCase(fetchOrgUnit.rejected, (s, a) => {
      s.selectedStatus = 'failed';
      s.error = a.error.message ?? 'Failed to fetch org unit';
    });

    /* ----------------------------- Mutations -------------------------------- */
    b.addCase(createOrgUnit.pending, (s) => {
      s.mutateStatus = 'loading';
    });
    b.addCase(createOrgUnit.fulfilled, (s, a) => {
      s.mutateStatus = 'succeeded';
      s.list.push(a.payload);
    });
    b.addCase(updateOrgUnit.fulfilled, (s, a) => {
      s.mutateStatus = 'succeeded';
      const idx = s.list.findIndex((u) => u.id === a.payload.id);
      if (idx >= 0) s.list[idx] = a.payload;
    });
    b.addCase(deleteOrgUnit.fulfilled, (s, a) => {
      s.mutateStatus = 'succeeded';
      s.list = s.list.filter((u) => u.id !== a.payload);
    });
  },
});

export const { resetOrgUnitsState } = orgUnitsSlice.actions;
export default orgUnitsSlice.reducer;

/* -------------------------------- Selectors -------------------------------- */

const slice = (s: any) => s.orgUnit ?? s.orgUnits ?? {};

export const selectOrgUnits = (s: any): OrgUnit[] => slice(s).list ?? [];
export const selectOrgTree = (s: any): OrgUnit[] => slice(s).tree ?? [];
export const selectOrgUnitsStatus = (s: any): Status =>
  slice(s).listStatus ?? 'idle';
export const selectOrgTreeStatus = (s: any): Status =>
  slice(s).treeStatus ?? 'idle';
export const selectSelectedUnit = (s: any): OrgUnit | null =>
  slice(s).selected ?? null;
