import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../api';

export type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

export type OrgBasic = {
  id: string;
  name: string;
  type: string;
  description?: string;
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
    students: number;
    parent: number;
  };
  pendingInvites: number;
  lastJoinAt: string | null;
};

export type DashboardConfig = {
  role: 'admin' | 'staff' | 'student' | 'parent' | string;
  orgType?: string | null;
  features: string[];
  widgets: string[];
  tables: string[];
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
  dashboardById: Record<
    string,
    { status: Status; data?: DashboardConfig; error?: string }
  >;
};

const initialState: OrgState = {
  basicById: {},
  summaryById: {},
  dashboardById: {},
};

export const fetchOrgBasic = createAsyncThunk(
  'admingOrg/fetchOrgBasic',
  async (orgId: string) => {
    const { data } = await api.get(`/api/orgs/${orgId}`);
    return data as OrgBasic;
  }
);

export const fetchOrgSummary = createAsyncThunk(
  'admingOrg/fetchOrgSummary',
  async (orgId: string) => {
    const { data } = await api.get(`/api/orgs/${orgId}/summary`);
    const normalized: OrgSummary = {
      ...data,
      lastJoinAt: data.lastJoinat ?? data.lastJoinAt ?? null,
    };
    return { orgId, data: normalized };
  }
);

export const fetchDashboardConfig = createAsyncThunk(
  'admingOrg/fetchDashboardConfig',
  async (orgId: string) => {
    const { data } = await api.get(`/api/orgs/${orgId}/dashboard-config`);
    return { orgId, data: data as DashboardConfig };
  }
);

const slice = createSlice({
  name: 'admingOrg',
  initialState,
  reducers: {
    clearOrgCache(state, action: PayloadAction<{ orgId: string }>) {
      const { orgId } = action.payload;
      delete state.basicById[orgId];
      delete state.summaryById[orgId];
      delete state.dashboardById[orgId];
    },
    clearAll(state) {
      state.basicById = {};
      state.summaryById = {};
      state.dashboardById = {};
    },
  },
  extraReducers: (b) => {
    //basic
    b.addCase(fetchOrgBasic.pending, (s, a) => {
      const id = a.meta.arg as string;
      s.basicById[id] = { status: 'loading' };
    });
    b.addCase(fetchOrgBasic.fulfilled, (s, a) => {
      s.basicById[a.payload.id] = { status: 'succeeded', data: a.payload };
    });
    b.addCase(fetchOrgBasic.rejected, (s, a) => {
      const id = a.meta.arg as string;
      s.basicById[id] = { status: 'failed', error: a.error.message };
    });

    // summary
    b.addCase(fetchOrgSummary.pending, (s, a) => {
      const id = a.meta.arg as string;
      s.summaryById[id] = { status: 'loading' };
    });
    b.addCase(fetchOrgSummary.fulfilled, (s, a) => {
      const { orgId, data } = a.payload;
      s.summaryById[orgId] = { status: 'succeeded', data };
    });
    b.addCase(fetchOrgSummary.rejected, (s, a) => {
      const id = a.meta.arg as string;
      s.summaryById[id] = { status: 'failed', error: a.error.message };
    });

    // dashboard-config
    b.addCase(fetchDashboardConfig.pending, (s, a) => {
      const id = a.meta.arg as string;
      s.dashboardById[id] = { status: 'loading' };
    });
    b.addCase(fetchDashboardConfig.fulfilled, (s, a) => {
      const { orgId, data } = a.payload;
      s.dashboardById[orgId] = { status: 'succeeded', data };
    });
    b.addCase(fetchDashboardConfig.rejected, (s, a) => {
      const id = a.meta.arg as string;
      s.dashboardById[id] = { status: 'failed', error: a.error.message };
    });
  },
});

export const { clearOrgCache, clearAll } = slice.actions;
export default slice.reducer;
