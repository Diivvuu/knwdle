import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../api';

export type OrgUnitType =
  | 'ORGANISATION'
  | 'DEPARTMENT'
  | 'CLASS'
  | 'SUBJECT'
  | 'BATCH'
  | 'SECTION'
  | 'GROUP'
  | 'OTHER';

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface OrgUnit {
  id: string;
  orgId?: string;
  name: string;
  parentId: string | null;
  parentName?: string | null;
  code: string | null;
  path?: string;
  type?: OrgUnitType;
  meta?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
  children?: OrgUnit[];
  _count?: { children: number; members: number };
}

export interface OrgUnitCreatePayload {
  orgId: string;
  name: string;
  code?: string;
  parentId?: string | null;
  type: OrgUnitType;
  meta?: Record<string, any>;
}

interface UnitsState {
  unitsByOrg: Record<
    string,
    { status: Status; items: OrgUnit[]; error?: string }
  >;
  unitsTreeByOrg: Record<
    string,
    { status: Status; data?: OrgUnit[]; error?: string }
  >;
  createStatus: Status;
  createError?: string | null;
  lastCreated?: OrgUnit;
}

const initialState: UnitsState = {
  unitsByOrg: {},
  unitsTreeByOrg: {},
  createStatus: 'idle',
  createError: null,
  lastCreated: undefined,
};

export const fetchOrgUnits = createAsyncThunk(
  'orgUnits/fetchAll',
  async (orgId: string) => {
    const { data } = await api.get(`/api/orgs/${orgId}/units`);
    return { orgId, items: data as OrgUnit[] };
  }
);

export const fetchOrgUnitsTree = createAsyncThunk(
  'orgUnits/fetchTree',
  async (orgId: string) => {
    const { data } = await api.get(`/api/orgs/${orgId}/units/tree`);
    return { orgId, data: data as OrgUnit[] };
  }
);

export const fetchOrgUnitDetail = createAsyncThunk(
  'orgUnits/fetchOne',
  async (p: { orgId: string; unitId: string }) => {
    const { data } = await api.get(`/api/orgs/${p.orgId}/units/${p.unitId}`);
    return data as OrgUnit;
  }
);

export const createOrgUnit = createAsyncThunk(
  'orgUnits/create',
  async (p: OrgUnitCreatePayload) => {
    const { orgId, ...body } = p;
    const { data } = await api.post(`/api/orgs/${orgId}/units`, body);
    return { orgId, unit: { ...(data as OrgUnit), orgId } };
  }
);

export const updateOrgUnit = createAsyncThunk(
  'orgUnits/update',
  async (p: {
    orgId: string;
    unitId: string;
    name?: string;
    code?: string;
    parentId?: string | null;
    type?: OrgUnitType;
    meta?: Record<string, any>;
  }) => {
    const { orgId, unitId, ...body } = p;
    const { data } = await api.patch(
      `/api/orgs/${orgId}/units/${unitId}`,
      body
    );
    return { orgId, unit: data as OrgUnit };
  }
);

export const deleteOrgUnit = createAsyncThunk(
  'orgUnits/delete',
  async (p: { orgId: string; unitId: string; force?: boolean }) => {
    const { orgId, unitId, force } = p;
    await api.delete(`/api/orgs/${orgId}/units/${unitId}`, {
      params: { force: Boolean(force) },
    });
    return { orgId, unitId };
  }
);

function insertIntoTree(tree: OrgUnit[], unit: OrgUnit): OrgUnit[] {
  if (!unit.parentId) return [{ ...unit, children: [] }, ...tree];
  const stack = [...tree];
  while (stack.length) {
    const node = stack.pop()!;
    if (node.id === unit.parentId) {
      node.children = node.children ? [unit, ...node.children] : [unit];
      return tree;
    }
    if (node.children?.length) stack.push(...node.children);
  }
  return [{ ...unit, children: [] }, ...tree];
}

const slice = createSlice({
  name: 'orgUnits',
  initialState,
  reducers: {
    resetCreateState(state) {
      state.createStatus = 'idle';
      state.createError = null;
      state.lastCreated = undefined;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchOrgUnits.pending, (s, a) => {
      const orgId = a.meta.arg;
      s.unitsByOrg[orgId] = s.unitsByOrg[orgId] || {
        status: 'idle',
        items: [],
      };
      s.unitsByOrg[orgId].status = 'loading';
    });
    b.addCase(fetchOrgUnits.fulfilled, (s, a) => {
      const { orgId, items } = a.payload;
      s.unitsByOrg[orgId] = { status: 'succeeded', items };
    });
    b.addCase(fetchOrgUnits.rejected, (s, a) => {
      const orgId = a.meta.arg;
      s.unitsByOrg[orgId] = {
        status: 'failed',
        items: [],
        error: a.error.message,
      };
    });

    b.addCase(fetchOrgUnitsTree.pending, (s, a) => {
      s.unitsTreeByOrg[a.meta.arg] = { status: 'loading' };
    });
    b.addCase(fetchOrgUnitsTree.fulfilled, (s, a) => {
      const { orgId, data } = a.payload;
      s.unitsTreeByOrg[orgId] = { status: 'succeeded', data };
    });
    b.addCase(fetchOrgUnitsTree.rejected, (s, a) => {
      s.unitsTreeByOrg[a.meta.arg] = {
        status: 'failed',
        error: a.error.message,
      };
    });

    b.addCase(createOrgUnit.pending, (s) => {
      s.createStatus = 'loading';
    });
    b.addCase(createOrgUnit.fulfilled, (s, a) => {
      s.createStatus = 'succeeded';
      const { orgId, unit } = a.payload;
      s.lastCreated = unit;

      const flat = s.unitsByOrg[orgId];
      if (flat?.items) flat.items = [unit, ...flat.items];

      const tree = s.unitsTreeByOrg[orgId];
      if (tree?.data) tree.data = insertIntoTree([...tree.data], unit);
    });
    b.addCase(createOrgUnit.rejected, (s, a) => {
      s.createStatus = 'failed';
      s.createError = a.error.message;
    });

    b.addCase(updateOrgUnit.fulfilled, (s, a) => {
      const { orgId, unit } = a.payload;
      const flat = s.unitsByOrg[orgId];
      if (flat?.items) {
        const i = flat.items.findIndex((u) => u.id === unit.id);
        if (i >= 0) flat.items[i] = { ...flat.items[i], ...unit };
      }
    });

    b.addCase(deleteOrgUnit.fulfilled, (s, a) => {
      const { orgId, unitId } = a.payload;
      const flat = s.unitsByOrg[orgId];
      if (flat?.items) flat.items = flat.items.filter((u) => u.id !== unitId);
    });
  },
});

export const { resetCreateState } = slice.actions;
export default slice.reducer;
