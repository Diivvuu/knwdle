// packages/state/src/slices/orgConnectDashboard.slice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../types';
import { api } from '../api';

interface OrgConnectHero {
  org: {
    id: string;
    name: string;
    type: string;
  };
  unit: {
    id: string | null;
    name: string | null;
    type: string | null;
  } | null;
}

interface AttendanceSummary {
  totalSessions: number;
  avgRate: number;
  lastSessionAt: string | null;
}

interface FeeSummary {
  totalPaid: number;
  totalDue: number;
  overdueCount: number;
}

interface AssignmentOrTest {
  id: string;
  title: string;
  dueAt: string;
}

interface Announcement {
  id: string;
  title: string;
  createdAt: string;
}

interface Achievement {
  id: string;
  title: string;
  awardedAt: string;
}

interface ResultSummary {
  avgScore: number | null;
  lastTestTitle: string | null;
  lastTestDate: string | null;
}

export interface OrgConnectDashboardState {
  hero: OrgConnectHero | null;
  summary: {
    attendance: AttendanceSummary | null;
    assignments: AssignmentOrTest[];
    tests: AssignmentOrTest[];
    fees: FeeSummary | null;
    achievements: { count: number; latest: Achievement[] } | null;
    results: ResultSummary | null;
  } | null;
  timetable: any[];
  announcements: Announcement[];
  config: {
    role: string;
    widgets: string[];
    tables: string[];
  } | null;
  loading: boolean;
  error: string | null;
}

const initialState: OrgConnectDashboardState = {
  hero: null,
  summary: null,
  timetable: [],
  announcements: [],
  config: null,
  loading: false,
  error: null,
};

// ─────────────────────────── Async Thunks ───────────────────────────

export const fetchConnectHero = createAsyncThunk(
  'orgConnectDashboard/fetchHero',
  async (orgId: string) => {
    const res = await api.get(`/api/orgs/${orgId}/connect-dashboard/hero`);
    return res.data;
  }
);

export const fetchConnectSummary = createAsyncThunk(
  'orgConnectDashboard/fetchSummary',
  async (orgId: string) => {
    const res = await api.get(`/api/orgs/${orgId}/connect-dashboard/summary`);
    return res.data;
  }
);

export const fetchConnectTimetable = createAsyncThunk(
  'orgConnectDashboard/fetchTimetable',
  async (orgId: string) => {
    const res = await api.get(
      `/api/orgs/${orgId}/connect-dashboard/timetable-today`
    );
    return res.data;
  }
);

export const fetchConnectAnnouncements = createAsyncThunk(
  'orgConnectDashboard/fetchAnnouncements',
  async (orgId: string) => {
    const res = await api.get(
      `/api/orgs/${orgId}/connect-dashboard/announcements-peek`
    );
    return res.data;
  }
);

export const fetchConnectConfig = createAsyncThunk(
  'orgConnectDashboard/fetchConfig',
  async (orgId: string) => {
    const res = await api.get(`/api/orgs/${orgId}/connect-dashboard/config`);
    return res.data;
  }
);

// ─────────────────────────── Slice ───────────────────────────

export const orgConnectDashboardSlice = createSlice({
  name: 'orgConnectDashboard',
  initialState,
  reducers: {
    resetConnectDashboard: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // HERO
      .addCase(fetchConnectHero.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConnectHero.fulfilled, (state, action) => {
        state.loading = false;
        state.hero = action.payload;
      })
      .addCase(fetchConnectHero.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load hero';
      })

      // SUMMARY
      .addCase(fetchConnectSummary.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchConnectSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchConnectSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load summary';
      })

      // TIMETABLE
      .addCase(fetchConnectTimetable.fulfilled, (state, action) => {
        state.timetable = action.payload;
      })

      // ANNOUNCEMENTS
      .addCase(fetchConnectAnnouncements.fulfilled, (state, action) => {
        state.announcements = action.payload;
      })

      // CONFIG
      .addCase(fetchConnectConfig.fulfilled, (state, action) => {
        state.config = action.payload;
      });
  },
});

export const { resetConnectDashboard } = orgConnectDashboardSlice.actions;

// ─────────────────────────── Selectors ───────────────────────────

export const selectConnectHero = (state: RootState) =>
  state.orgConnectDashboard.hero;
export const selectConnectSummary = (state: RootState) =>
  state.orgConnectDashboard.summary;
export const selectConnectTimetable = (state: RootState) =>
  state.orgConnectDashboard.timetable;
export const selectConnectAnnouncements = (state: RootState) =>
  state.orgConnectDashboard.announcements;
export const selectConnectConfig = (state: RootState) =>
  state.orgConnectDashboard.config;
export const selectConnectLoading = (state: RootState) =>
  state.orgConnectDashboard.loading;

// ─────────────────────────── Export Reducer ───────────────────────────

export default orgConnectDashboardSlice.reducer;
