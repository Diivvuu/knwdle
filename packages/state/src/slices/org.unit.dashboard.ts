import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../api';

/* ---------------------------------- Types --------------------------------- */
type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface UnitDashboardConfig {
  role: string;
  orgType: string;
  features: string[];
  widgets: string[];
  tables: string[];
}

export interface UnitHero {
  id: string;
  name: string;
  type: string;
  meta: Record<string, any>;
  _count: { members: number };
}

export interface AttendanceSummary {
  totalSessions: number;
  avgRate: number;
  lastSessionAt: string | null;
}

export interface UnitSummary {
  attendance: AttendanceSummary;
  results: { count: number };
  assignments: { count: number };
  tests: { count: number };
}

export interface TimeTableEntry {
  id: string;
  startTime: string;
  endTime: string;
  room?: string | null;
  mode?: string | null;
  subject?: { id: string; name: string } | null;
  teacher?: { id: string; name: string } | null;
}

export interface Announcement {
  id: string;
  title: string;
  body?: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  dueAt: string;
}

export interface Test {
  id: string;
  title: string;
  dueAt: string;
}

export interface FeeSnapshot {
  totalPaid: number;
  totalDue: number;
  overdueCount: number;
}

/* --------------------------------- Thunks --------------------------------- */

// GET /api/orgs/:orgId/units/:unitId/dashboard/config
export const fetchUnitDashboardConfig = createAsyncThunk(
  'orgUnitDashboard/fetchConfig',
  async (p: { orgId: string; unitId: string }) => {
    const { data } = await api.get<UnitDashboardConfig>(
      `/api/orgs/${p.orgId}/units/${p.unitId}/dashboard/config`
    );
    return data;
  }
);

// GET /api/orgs/:orgId/units/:unitId/dashboard/hero
export const fetchUnitHero = createAsyncThunk(
  'orgUnitDashboard/fetchHero',
  async (p: { orgId: string; unitId: string }) => {
    const { data } = await api.get<UnitHero>(
      `/api/orgs/${p.orgId}/units/${p.unitId}/dashboard/hero`
    );
    return data;
  }
);

// GET /api/orgs/:orgId/units/:unitId/dashboard/summary
export const fetchUnitSummary = createAsyncThunk(
  'orgUnitDashboard/fetchSummary',
  async (p: {
    orgId: string;
    unitId: string;
    range?: '7d' | '30d' | '90d';
  }) => {
    const range = p.range ?? '30d';
    const { data } = await api.get<UnitSummary>(
      `/api/orgs/${p.orgId}/units/${p.unitId}/dashboard/summary?range=${range}`
    );
    return data;
  }
);

// other widgets
export const fetchUnitTimetableToday = createAsyncThunk(
  'orgUnitDashboard/fetchTimetable',
  async (p: { orgId: string; unitId: string }) => {
    const { data } = await api.get<TimeTableEntry[]>(
      `/api/orgs/${p.orgId}/units/${p.unitId}/dashboard/widgets/timetable-today`
    );
    return data;
  }
);

export const fetchUnitAnnouncements = createAsyncThunk(
  'orgUnitDashboard/fetchAnnouncements',
  async (p: { orgId: string; unitId: string }) => {
    const { data } = await api.get<Announcement[]>(
      `/api/orgs/${p.orgId}/units/${p.unitId}/dashboard/widgets/announcements-peek`
    );
    return data;
  }
);

export const fetchUnitAssignments = createAsyncThunk(
  'orgUnitDashboard/fetchAssignments',
  async (p: { orgId: string; unitId: string }) => {
    const { data } = await api.get<Assignment[]>(
      `/api/orgs/${p.orgId}/units/${p.unitId}/dashboard/widgets/assignments-due`
    );
    return data;
  }
);

export const fetchUnitTests = createAsyncThunk(
  'orgUnitDashboard/fetchTests',
  async (p: { orgId: string; unitId: string }) => {
    const { data } = await api.get<Test[]>(
      `/api/orgs/${p.orgId}/units/${p.unitId}/dashboard/widgets/tests-due`
    );
    return data;
  }
);

export const fetchUnitFees = createAsyncThunk(
  'orgUnitDashboard/fetchFees',
  async (p: { orgId: string; unitId: string }) => {
    const { data } = await api.get<FeeSnapshot>(
      `/api/orgs/${p.orgId}/units/${p.unitId}/dashboard/widgets/fees-snapshot`
    );
    return data;
  }
);

/* ---------------------------------- Slice --------------------------------- */

interface OrgUnitDashboardState {
  config?: UnitDashboardConfig | null;
  hero?: UnitHero | null;
  summary?: UnitSummary | null;
  timetable?: TimeTableEntry[];
  announcements?: Announcement[];
  assignments?: Assignment[];
  tests?: Test[];
  fees?: FeeSnapshot | null;

  status: Status;
  error?: string | null;
}

const initialState: OrgUnitDashboardState = {
  config: null,
  hero: null,
  summary: null,
  timetable: [],
  announcements: [],
  assignments: [],
  tests: [],
  fees: null,
  status: 'idle',
  error: null,
};

const orgUnitDashboardSlice = createSlice({
  name: 'orgUnitDashboard',
  initialState,
  reducers: {
    resetUnitDashboard(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (b) => {
    const handle = (thunk: any, key: keyof OrgUnitDashboardState) => {
      b.addCase(thunk.pending, (s) => {
        s.status = 'loading';
      });
      b.addCase(thunk.fulfilled, (s, a) => {
        s.status = 'succeeded';
        (s as any)[key] = a.payload;
      });
      b.addCase(thunk.rejected, (s, a) => {
        s.status = 'failed';
        s.error = a.error.message ?? `Failed to load ${key}`;
      });
    };

    handle(fetchUnitDashboardConfig, 'config');
    handle(fetchUnitHero, 'hero');
    handle(fetchUnitSummary, 'summary');
    handle(fetchUnitTimetableToday, 'timetable');
    handle(fetchUnitAnnouncements, 'announcements');
    handle(fetchUnitAssignments, 'assignments');
    handle(fetchUnitTests, 'tests');
    handle(fetchUnitFees, 'fees');
  },
});

export const { resetUnitDashboard } = orgUnitDashboardSlice.actions;
export default orgUnitDashboardSlice.reducer;

/* -------------------------------- Selectors -------------------------------- */

const slice = (s: any) => s.orgUnitDashboard ?? {};

export const selectUnitDashboardConfig = (s: any) => slice(s).config;
export const selectUnitHero = (s: any) => slice(s).hero;
export const selectUnitSummary = (s: any) => slice(s).summary;
export const selectUnitTimetable = (s: any) => slice(s).timetable ?? [];
export const selectUnitAnnouncements = (s: any) => slice(s).announcements ?? [];
export const selectUnitAssignments = (s: any) => slice(s).assignments ?? [];
export const selectUnitTests = (s: any) => slice(s).tests ?? [];
export const selectUnitFees = (s: any) => slice(s).fees;
export const selectUnitDashboardStatus = (s: any): Status =>
  slice(s).status ?? 'idle';
export const selectUnitDashboardError = (s: any): string | null =>
  slice(s).error ?? null;
export const selectUnitDashboardLoading = (s: any): boolean =>
  slice(s).status === 'loading';