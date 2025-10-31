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

export type UnitGlance = {
  id: string;
  name: string;
  type: string;
  memberCount: number;
};

export type MemberPeek = {
  id: string;
  name: string | null;
  role: string;
  joinedAt: string;
};

export type AnnouncementPeek = {
  id: string;
  title: string;
  pin: boolean;
  createdAt: string;
};

export type AttendanceSnapshot = {
  totalSessions: number;
  avgRate: number;
  lastSessionAt: string | null;
};

export type FeesSnapshot = {
  totalDue: number;
  totalPaid: number;
  overdueCount: number;
};

type Loadable<T> = { status: Status; data?: T; error?: string };

type OrgState = {
  basicById: Record<string, Loadable<OrgBasic>>;
  summaryById: Record<string, Loadable<OrgSummary>>;
  dashboardById: Record<string, Loadable<DashboardConfig>>;
  unitsGlanceById: Record<string, Loadable<UnitGlance[]>>;
  membersPeekById: Record<string, Loadable<MemberPeek[]>>;
  announcementsPeekById: Record<string, Loadable<AnnouncementPeek[]>>;
  attendanceSnapshotById: Record<string, Loadable<AttendanceSnapshot>>;
  feesSnapshotById: Record<string, Loadable<FeesSnapshot>>;
};

const initialState: OrgState = {
  basicById: {},
  summaryById: {},
  dashboardById: {},
  unitsGlanceById: {},
  membersPeekById: {},
  announcementsPeekById: {},
  attendanceSnapshotById: {},
  feesSnapshotById: {},
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

export const fetchUnitsGlance = createAsyncThunk(
  'adminDashboard/fetchUnitsGlance',
  async (orgId: string) => {
    const { data } = await api.get(`/api/orgs/${orgId}/units/glance`);
    return { orgId, data: data as UnitGlance[] };
  }
);

export const fetchMembersPeek = createAsyncThunk(
  'adminDashboard/fetchMembersPeek',
  async (orgId: string) => {
    const { data } = await api.get(`/api/orgs/${orgId}/members/peek`);
    return { orgId, data: data as MemberPeek[] };
  }
);

export const fetchAnnouncementsPeek = createAsyncThunk(
  'adminOrg/fetchAnnouncementsPeek',
  async (orgId: string) => {
    const { data } = await api.get(`/api/orgs/${orgId}/announcements/peek`);
    return { orgId, data: data as AnnouncementPeek[] };
  }
);

export const fetchAttendanceSnapshot = createAsyncThunk(
  'adminOrg/fetchAttendanceSnapshot',
  async (orgId: string) => {
    const { data } = await api.get(`/api/orgs/${orgId}/attendance/snapshot`);
    return { orgId, data: data as AttendanceSnapshot };
  }
);

export const fetchFeesSnapshot = createAsyncThunk(
  'adminOrg/fetchFeesSnapshot',
  async (orgId: string) => {
    const { data } = await api.get(`/api/orgs/${orgId}/fees/snapshot`);
    return { orgId, data: data as FeesSnapshot };
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
      delete state.unitsGlanceById[orgId];
      delete state.membersPeekById[orgId];
      delete state.announcementsPeekById[orgId];
      delete state.attendanceSnapshotById[orgId];
      delete state.feesSnapshotById[orgId];
    },
    clearAll(state) {
      state.basicById = {};
      state.summaryById = {};
      state.dashboardById = {};

      state.unitsGlanceById = {};
      state.membersPeekById = {};
      state.announcementsPeekById = {};
      state.attendanceSnapshotById = {};
      state.feesSnapshotById = {};
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

    // units glance
    b.addCase(fetchUnitsGlance.pending, (s, a) => {
      const id = a.meta.arg as string;
      s.unitsGlanceById[id] = { status: 'loading' };
    });
    b.addCase(fetchUnitsGlance.fulfilled, (s, a) => {
      const { orgId, data } = a.payload;
      s.unitsGlanceById[orgId] = { status: 'succeeded', data };
    });
    b.addCase(fetchUnitsGlance.rejected, (s, a) => {
      const id = a.meta.arg as string;
      s.unitsGlanceById[id] = { status: 'failed', error: a.error.message };
    });

    //members peek
    b.addCase(fetchMembersPeek.pending, (s, a) => {
      const id = a.meta.arg as string;
      s.membersPeekById[id] = { status: 'loading' };
    });
    b.addCase(fetchMembersPeek.fulfilled, (s, a) => {
      const { orgId, data } = a.payload;
      s.membersPeekById[orgId] = { status: 'succeeded', data };
    });
    b.addCase(fetchMembersPeek.rejected, (s, a) => {
      const id = a.meta.arg as string;
      s.membersPeekById[id] = { status: 'failed', error: a.error.message };
    });

    // announcements peek
    b.addCase(fetchAnnouncementsPeek.pending, (s, a) => {
      const id = a.meta.arg as string;
      s.announcementsPeekById[id] = { status: 'loading' };
    });
    b.addCase(fetchAnnouncementsPeek.fulfilled, (s, a) => {
      const { orgId, data } = a.payload;
      s.announcementsPeekById[orgId] = { status: 'succeeded', data };
    });
    b.addCase(fetchAnnouncementsPeek.rejected, (s, a) => {
      const id = a.meta.arg as string;
      s.announcementsPeekById[id] = {
        status: 'failed',
        error: a.error.message,
      };
    });

    //attendance snapshot
    b.addCase(fetchAttendanceSnapshot.pending, (s, a) => {
      const id = a.meta.arg as string;
      s.attendanceSnapshotById[id] = { status: 'loading' };
    });
    b.addCase(fetchAttendanceSnapshot.fulfilled, (s, a) => {
      const { orgId, data } = a.payload;
      s.attendanceSnapshotById[orgId] = { status: 'succeeded', data };
    });
    b.addCase(fetchAttendanceSnapshot.rejected, (s, a) => {
      const id = a.meta.arg as string;
      s.attendanceSnapshotById[id] = {
        status: 'failed',
        error: a.error.message,
      };
    });

    //fees snapshot
    b.addCase(fetchFeesSnapshot.pending, (s, a) => {
      const id = a.meta.arg as string;
      s.feesSnapshotById[id] = { status: 'loading' };
    });
    b.addCase(fetchFeesSnapshot.fulfilled, (s, a) => {
      const { orgId, data } = a.payload;
      s.feesSnapshotById[orgId] = { status: 'succeeded', data };
    });
    b.addCase(fetchFeesSnapshot.rejected, (s, a) => {
      const id = a.meta.arg as string;
      s.feesSnapshotById[id] = { status: 'failed', error: a.error.message };
    });
  },
});

export const { clearOrgCache, clearAll } = slice.actions;
export default slice.reducer;
