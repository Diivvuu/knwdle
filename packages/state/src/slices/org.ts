import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../api';

export type ParentRole = 'admin' | 'staff' | 'student' | 'parent';

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

export type OrgBasic = {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  teamSize?: string | null;
  country?: string | null;
  timezone?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  brand_color?: string | null;
  address?: string | null;
  contactPhone?: string | null;
  createdAt: string;
  profile?: { id: string; orgId: string; meta: Record<string, any> } | null;
  aggregates?: { unitsCount: number; membersCount: number };
};

export type OrgSummary = {
  unitsCount: number;
  roleCounts: {
    admin: number;
    staff: number;
    student: number;
    parent: number;
  };
  pendingInvites: number;
  lastJoinAt: string | null;
};

export type OrgUnit = {
  id: string;
  name: string;
  parentId: string | null;
  code: string | null;
  path?: string;
  createdAt: string;
  children?: OrgUnit[];
};

export type MemberRow = {
  id: string;
  orgId: string;
  userId: string;
  email: string | null;
  name: string | null;
  role: ParentRole;
  unitId: string | null;
  roleId: string | null;
  joinedAt: string;
};

export type MembersQuery = {
  orgId: string;
  limit?: number;
  cursor?: string | null;
  role?: ParentRole;
  unitId?: string;
  q?: string;
  append?: boolean;
};

type OrgState = {
  basicById: Record<
    string,
    { status: Status; data?: OrgBasic; error?: string }
  >;
  summaryById: Record<
    string,
    { status: Status; data?: OrgSummary; error?: string }
  >;

  unitsByOrg: Record<
    string,
    { status: Status; items: OrgUnit[]; error?: string }
  >;
  unitsTreeByOrg: Record<
    string,
    { status: Status; data?: OrgUnit[]; error?: string }
  >;

  membersByKey: Record<
    string,
    {
      status: Status;
      items: MemberRow[];
      nextCursor: string | null;
      error?: string;
    }
  >;
};

const initialState: OrgState = {
  basicById: {},
  summaryById: {},
  unitsByOrg: {},
  unitsTreeByOrg: {},
  membersByKey: {},
};

const mkMembersKey = (
  p: Pick<MembersQuery, 'orgId' | 'unitId' | 'role' | 'q'>
) => `${p.orgId}|${p.unitId ?? ''}|${p.role ?? ''}|${p.q ?? ''}`;

export const fetchOrgBasic = createAsyncThunk(
  'adminOrg/fetchOrgBasic',
  async (orgId: string) => {
    const { data } = await api.get(`/api/orgs/${orgId}`);
    return data as OrgBasic;
  }
);

export const fetchOrgSummary = createAsyncThunk(
  'adminOrg/fetchOrgSummary',
  async (orgId: string) => {
    const { data } = await api.get(`/api/orgs/${orgId}/summary`);
    const normalized = {
      ...data,
      lastJoinAt: data.lastJoinat ?? null,
    } as OrgSummary;
    return { orgId, data: normalized };
  }
);

export const fetchOrgUnits = createAsyncThunk(
  'admingOrg/fetchOrgUnits',
  async (orgId: string) => {
    const { data } = await api.get(`/api/orgs/${orgId}/units`);
    return { orgId, items: data as OrgUnit[] };
  }
);

export const fetchOrgUnitsTree = createAsyncThunk(
  'adminOrg/fetchOrgUnitsTree',
  async (orgId: string) => {
    const { data } = await api.get(`/api/orgs/${orgId}/units/tree`);
    return { orgId, data: data as OrgUnit[] };
  }
);

export const createOrgUnit = createAsyncThunk(
  'admingOrg/createOrgUnit',
  async (p: {
    orgId: string;
    name: string;
    code?: string;
    parentId?: string | null;
  }) => {
    const { orgId, ...body } = p;
    const { data } = await api.post(`/api/orgs/${orgId}/units`, body);
    return { orgId, unit: data as OrgUnit };
  }
);

export const updateOrgUnit = createAsyncThunk(
  'adminOrg/updateOrgUnit',
  async (p: {
    orgId: string;
    unitId: string;
    name?: string;
    code?: string;
    parentId?: string | null;
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
  'admingOrg/deleteOrgUnit',
  async (p: { orgId: string; unitId: string; force?: boolean }) => {
    const { orgId, unitId, force } = p;
    await api.delete(`/api/orgs/${orgId}/units/${unitId}`, {
      params: { force: Boolean(force) },
    });
    return { orgId, unitId };
  }
);

export const listMembers = createAsyncThunk(
  'adminOrg/listMembers',
  async (p: MembersQuery) => {
    const { orgId, unitId, append, ...query } = p;
    const url = unitId
      ? `/api/orgs/${orgId}/units/${unitId}/members`
      : `/api/orgs/${orgId}/members`;

    const { data } = await api.get(url, { params: query });
    return {
      key: mkMembersKey(p),
      append: Boolean(append && query.cursor),
      items: (data.items ?? []) as MemberRow[],
      nextCursor: (data.nextCursor ?? null) as string | null,
    };
  }
);

export const updateMemberBaseRole = createAsyncThunk(
  'adminOrg/updateMemberBaseRole',
  async (p: { orgId: string; userId: string; role: ParentRole }) => {
    const { data } = await api.patch(
      `/api/orgs/${p.orgId}/members/${p.userId}`,
      {
        role: p.role,
      }
    );
    return data as MemberRow;
  }
);

export const updateMemberUnit = createAsyncThunk(
  'adminOrg/updateMemberUnit',
  async (p: { orgId: string; userId: string; unitId: string | null }) => {
    const { data } = await api.patch(
      `/api/orgs/${p.orgId}/members/${p.userId}/unit`,
      { unitId: p.unitId }
    );
    return data as MemberRow;
  }
);

export const assignCustomRole = createAsyncThunk(
  'admingOrg/assignCustomRole',
  async (p: { orgId: string; userId: string; roleId: string | null }) => {
    const { data } = await api.patch(`/api/orgs/${p.orgId}/members/role`, {
      userId: p.userId,
      roleId: p.roleId,
    });
    return data as MemberRow;
  }
);

export const removeMember = createAsyncThunk(
  'adminOrg/removeMember',
  async (p: { orgId: string; userId: string }) => {
    await api.delete(`/api/orgs/${p.orgId}/members/${p.userId}`);
    return { orgId: p.orgId, userId: p.userId };
  }
);

const slice = createSlice({
  name: 'adminOrg',
  initialState,
  reducers: {
    clearMembersPage(
      state,
      action: PayloadAction<{
        orgId: string;
        unitId?: string;
        role?: ParentRole;
        q?: string;
      }>
    ) {
      const key = mkMembersKey(action.payload);
      delete state.membersByKey[key];
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchOrgBasic.pending, (s, a) => {
      const id = a.meta.arg;
      s.basicById[id] = { status: 'loading' };
    });
    b.addCase(fetchOrgBasic.fulfilled, (s, a) => {
      s.basicById[a.payload.id] = { status: 'succeeded', data: a.payload };
    });
    b.addCase(fetchOrgBasic.rejected, (s, a) => {
      const id = a.meta.arg;
      s.basicById[id] = { status: 'failed', error: a.error.message };
    });

    //summary
    b.addCase(fetchOrgSummary.pending, (s, a) => {
      const id = a.meta.arg;
      s.summaryById[id] = { status: 'loading' };
    });
    b.addCase(fetchOrgSummary.fulfilled, (s, a) => {
      const { orgId, data } = a.payload;
      s.summaryById[orgId] = { status: 'succeeded', data };
    });
    b.addCase(fetchOrgSummary.rejected, (s, a) => {
      const id = a.meta.arg;
      s.summaryById[id] = { status: 'failed', error: a.error.message };
    });

    //units
    b.addCase(fetchOrgUnits.pending, (s, a) => {
      const orgId = a.meta.arg;
      s.unitsByOrg[orgId] = s.unitsByOrg[orgId] || {
        status: 'idle',
        items: [],
      };
      s.unitsByOrg[orgId].status = 'loading';
      s.unitsByOrg[orgId].error = undefined;
    });
    b.addCase(fetchOrgUnits.fulfilled, (s, a) => {
      const { orgId, items } = a.payload;
      s.unitsByOrg[orgId] = { status: 'succeeded', items };
    });
    b.addCase(fetchOrgUnits.rejected, (s, a) => {
      const orgId = a.meta.arg;
      s.unitsByOrg[orgId] = s.unitsByOrg[orgId] || {
        status: 'idle',
        items: [],
      };
      s.unitsByOrg[orgId].status = 'failed';
      s.unitsByOrg[orgId].error = a.error.message;
    });

    // units tree
    b.addCase(fetchOrgUnitsTree.pending, (s, a) => {
      const orgId = a.meta.arg;
      s.unitsTreeByOrg[orgId] = { status: 'loading' };
    });
    b.addCase(fetchOrgUnitsTree.fulfilled, (s, a) => {
      const { orgId, data } = a.payload;
      s.unitsTreeByOrg[orgId] = { status: 'succeeded', data };
    });
    b.addCase(fetchOrgUnitsTree.rejected, (s, a) => {
      const orgId = a.meta.arg;
      s.unitsTreeByOrg[orgId] = { status: 'failed', error: a.error.message };
    });

    //unit mutations
    b.addCase(createOrgUnit.fulfilled, (s, a) => {
      const { orgId, unit } = a.payload;
      const entry = s.unitsByOrg[orgId];
      if (entry) entry.items = [unit, ...entry.items];
    });
    b.addCase(updateOrgUnit.fulfilled, (s, a) => {
      const { orgId, unit } = a.payload;
      const entry = s.unitsByOrg[orgId];
      if (entry) {
        const idx = entry.items.findIndex((u) => u.id === unit.id);
        if (idx >= 0) entry.items[idx] = unit;
      }
    });
    b.addCase(deleteOrgUnit.fulfilled, (s, a) => {
      const { orgId, unitId } = a.payload;
      const entry = s.unitsByOrg[orgId];
      if (entry) entry.items = entry.items.filter((u) => u.id !== unitId);
    });

    //members list
    b.addCase(listMembers.pending, (s, a) => {
      const key = mkMembersKey(a.meta.arg);
      const entry = s.membersByKey[key] || {
        status: 'idle',
        items: [],
        nextCursor: null,
      };
      entry.status = 'loading';
      entry.error = undefined;
      s.membersByKey[key] = entry;
    });
    b.addCase(listMembers.fulfilled, (s, a) => {
      const { key, append, items, nextCursor } = a.payload;
      const entry = s.membersByKey[key] || {
        status: 'idle',
        items: [],
        nextCursor: null,
      };
      entry.status = 'succeeded';
      entry.items = append ? [...entry.items, ...items] : items;
      entry.nextCursor = nextCursor;
      s.membersByKey[key] = entry;
    });
    b.addCase(listMembers.rejected, (s, a) => {
      const key = mkMembersKey(a.meta.arg);
      const entry = s.membersByKey[key] || {
        status: 'idle',
        items: [],
        nextCursor: null,
      };
      entry.status = 'failed';
      entry.error = a.error.message;
      s.membersByKey[key] = entry;
    });

    //member mutations : update local rows wherever they appear for org
    const patchMemberEverywhere = (state: OrgState, updated: MemberRow) => {
      const prefix = `${updated.orgId}`;
      for (const [key, page] of Object.entries(state.membersByKey)) {
        if (!key.startsWith(prefix)) continue;
        const i = page.items.findIndex((m) => m.userId === updated.userId);
        if (i >= 0) page.items[i] = { ...page.items[i], ...updated };
      }
    };

    b.addCase(updateMemberBaseRole.fulfilled, (s, a) => {
      patchMemberEverywhere(s, a.payload);
    });
    b.addCase(updateMemberUnit.fulfilled, (s, a) => {
      patchMemberEverywhere(s, a.payload);
    });
    b.addCase(assignCustomRole.fulfilled, (s, a) => {
      patchMemberEverywhere(s, a.payload);
    });
    b.addCase(removeMember.fulfilled, (s, a) => {
      const { orgId, userId } = a.payload;
      for (const [key, page] of Object.entries(s.membersByKey)) {
        if (!key.startsWith(`${orgId}|`)) continue;
        page.items = page.items.filter((m) => m.userId !== userId);
      }
    });
  },
});

export const { clearMembersPage } = slice.actions;
export default slice.reducer;
