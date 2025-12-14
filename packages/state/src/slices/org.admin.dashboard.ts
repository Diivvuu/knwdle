import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../api';

export type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

/* --------------------------- Types --------------------------- */
export type OrgBasic = {
  id: string;
  name: string;
  type: string;
  description?: string;
  teamSize?: string | null;
  country?: string | null;
  timezone?: string | null;
  logoUrl?: string | undefined;
  coverUrl?: string | undefined;
  brand_color?: string | undefined;
  address?: string | null;
  contactPhone?: string | null;
  createdAt: string;
  profile?: { id: string; orgId: string; meta: Record<string, any> } | null;
  aggregates?: { audiencesCount: number; membersCount: number };
};

export type OrgSummary = {
  audiencesCount: number;
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

export type AudienceGlance = {
  id: string;
  name: string;
  type: string;
  memberCount: number;
};

export type MemberPeek = {
  id: string;
  role: string;
  joinedAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    mobile?: string | null;
    profilePhoto?: string | null;
  };
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
  audiencesGlanceById: Record<string, Loadable<AudienceGlance[]>>;
  membersPeekById: Record<string, Loadable<MemberPeek[]>>;
  announcementsPeekById: Record<string, Loadable<AnnouncementPeek[]>>;
  attendanceSnapshotById: Record<string, Loadable<AttendanceSnapshot>>;
  feesSnapshotById: Record<string, Loadable<FeesSnapshot>>;
};

/* --------------------------- Initial State --------------------------- */
const initialState: OrgState = {
  basicById: {},
  summaryById: {},
  dashboardById: {},
  audiencesGlanceById: {},
  membersPeekById: {},
  announcementsPeekById: {},
  attendanceSnapshotById: {},
  feesSnapshotById: {},
};

/* --------------------------- Thunks --------------------------- */
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
    const normalized: OrgSummary = {
      ...data,
      lastJoinAt: data.lastJoinat ?? data.lastJoinAt ?? null,
    };
    return { orgId, data: normalized };
  }
);

export const fetchDashboardConfig = createAsyncThunk(
  'adminOrg/fetchDashboardConfig',
  async (orgId: string) => {
    const { data } = await api.get(`/api/orgs/${orgId}/dashboard-config`);
    return { orgId, data: data as DashboardConfig };
  }
);

export const fetchAudiencesGlance = createAsyncThunk(
  'adminDashboard/fetchAudiencesGlance',
  async (orgId: string) => {
    const { data } = await api.get(`/api/orgs/${orgId}/audiences/glance`);
    return { orgId, data: data as AudienceGlance[] };
  }
);

export const fetchMembersPeek = createAsyncThunk(
  'adminDashboard/fetchMembersPeek',
  async (orgId: string) => {
    const { data } = await api.get(`/api/orgs/${orgId}/members/peek`);
    // ✅ Normalize shape for both `{ items, count }` or array
    const normalized = Array.isArray(data) ? data : (data?.items ?? []);
    return { orgId, data: normalized as MemberPeek[] };
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

/* --------------------------- Slice --------------------------- */
const slice = createSlice({
  name: 'adminOrg',
  initialState,
  reducers: {
    clearOrgCache(state, action: PayloadAction<{ orgId: string }>) {
      const { orgId } = action.payload;
      delete state.basicById[orgId];
      delete state.summaryById[orgId];
      delete state.dashboardById[orgId];
      delete state.audiencesGlanceById[orgId];
      delete state.membersPeekById[orgId];
      delete state.announcementsPeekById[orgId];
      delete state.attendanceSnapshotById[orgId];
      delete state.feesSnapshotById[orgId];
    },
    clearAll(state) {
      Object.keys(state).forEach((k) => {
        // @ts-expect-error dynamic clear
        state[k] = {};
      });
    },
  },
  extraReducers: (b) => {
    /* ------------------ Basic ------------------ */
    b.addCase(fetchOrgBasic.pending, (s, a) => {
      s.basicById[a.meta.arg] = { status: 'loading' };
    });
    b.addCase(fetchOrgBasic.fulfilled, (s, a) => {
      s.basicById[a.payload.id] = { status: 'succeeded', data: a.payload };
    });
    b.addCase(fetchOrgBasic.rejected, (s, a) => {
      s.basicById[a.meta.arg] = { status: 'failed', error: a.error.message };
    });

    /* ------------------ Summary ------------------ */
    b.addCase(fetchOrgSummary.pending, (s, a) => {
      s.summaryById[a.meta.arg] = { status: 'loading' };
    });
    b.addCase(fetchOrgSummary.fulfilled, (s, a) => {
      s.summaryById[a.payload.orgId] = {
        status: 'succeeded',
        data: a.payload.data,
      };
    });
    b.addCase(fetchOrgSummary.rejected, (s, a) => {
      s.summaryById[a.meta.arg] = { status: 'failed', error: a.error.message };
    });

    /* ------------------ Dashboard Config ------------------ */
    b.addCase(fetchDashboardConfig.pending, (s, a) => {
      s.dashboardById[a.meta.arg] = { status: 'loading' };
    });
    b.addCase(fetchDashboardConfig.fulfilled, (s, a) => {
      s.dashboardById[a.payload.orgId] = {
        status: 'succeeded',
        data: a.payload.data,
      };
    });
    b.addCase(fetchDashboardConfig.rejected, (s, a) => {
      s.dashboardById[a.meta.arg] = {
        status: 'failed',
        error: a.error.message,
      };
    });

    /* ------------------ Audiences Glance ------------------ */
    b.addCase(fetchAudiencesGlance.pending, (s, a) => {
      s.audiencesGlanceById[a.meta.arg] = { status: 'loading' };
    });
    b.addCase(fetchAudiencesGlance.fulfilled, (s, a) => {
      s.audiencesGlanceById[a.payload.orgId] = {
        status: 'succeeded',
        data: a.payload.data,
      };
    });
    b.addCase(fetchAudiencesGlance.rejected, (s, a) => {
      s.audiencesGlanceById[a.meta.arg] = {
        status: 'failed',
        error: a.error.message,
      };
    });

    /* ------------------ Members Peek ------------------ */
    b.addCase(fetchMembersPeek.pending, (s, a) => {
      s.membersPeekById[a.meta.arg] = { status: 'loading' };
    });
    b.addCase(fetchMembersPeek.fulfilled, (s, a) => {
      s.membersPeekById[a.payload.orgId] = {
        status: 'succeeded',
        data: a.payload.data,
      };
    });
    b.addCase(fetchMembersPeek.rejected, (s, a) => {
      s.membersPeekById[a.meta.arg] = {
        status: 'failed',
        error: a.error.message,
      };
    });

    /* ------------------ Announcements Peek ------------------ */
    b.addCase(fetchAnnouncementsPeek.pending, (s, a) => {
      s.announcementsPeekById[a.meta.arg] = { status: 'loading' };
    });
    b.addCase(fetchAnnouncementsPeek.fulfilled, (s, a) => {
      s.announcementsPeekById[a.payload.orgId] = {
        status: 'succeeded',
        data: a.payload.data,
      };
    });
    b.addCase(fetchAnnouncementsPeek.rejected, (s, a) => {
      s.announcementsPeekById[a.meta.arg] = {
        status: 'failed',
        error: a.error.message,
      };
    });

    /* ------------------ Attendance Snapshot ------------------ */
    b.addCase(fetchAttendanceSnapshot.pending, (s, a) => {
      s.attendanceSnapshotById[a.meta.arg] = { status: 'loading' };
    });
    b.addCase(fetchAttendanceSnapshot.fulfilled, (s, a) => {
      s.attendanceSnapshotById[a.payload.orgId] = {
        status: 'succeeded',
        data: a.payload.data,
      };
    });
    b.addCase(fetchAttendanceSnapshot.rejected, (s, a) => {
      s.attendanceSnapshotById[a.meta.arg] = {
        status: 'failed',
        error: a.error.message,
      };
    });

    /* ------------------ Fees Snapshot ------------------ */
    b.addCase(fetchFeesSnapshot.pending, (s, a) => {
      s.feesSnapshotById[a.meta.arg] = { status: 'loading' };
    });
    b.addCase(fetchFeesSnapshot.fulfilled, (s, a) => {
      s.feesSnapshotById[a.payload.orgId] = {
        status: 'succeeded',
        data: a.payload.data,
      };
    });
    b.addCase(fetchFeesSnapshot.rejected, (s, a) => {
      s.feesSnapshotById[a.meta.arg] = {
        status: 'failed',
        error: a.error.message,
      };
    });
  },
});

export const { clearOrgCache, clearAll } = slice.actions;
export default slice.reducer;
