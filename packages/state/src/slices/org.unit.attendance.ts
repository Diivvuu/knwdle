import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../api';
import { RootState } from '../types';
/* ────────────────────────────────
   Async Thunks
   ──────────────────────────────── */

// 1️⃣ List sessions
export const fetchAttendanceSessions = createAsyncThunk(
  'orgUnitAttendance/fetchSessions',
  async ({ orgId, unitId }: { orgId: string; unitId: string }) => {
    const res = await api.get(
      `/api/orgs/${orgId}/units/${unitId}/attendance/sessions`
    );
    return res.data;
  }
);

// 2️⃣ Create new session
export const createAttendanceSession = createAsyncThunk(
  'orgUnitAttendance/createSession',
  async ({
    orgId,
    unitId,
    body,
  }: {
    orgId: string;
    unitId: string;
    body: Record<string, any>;
  }) => {
    const res = await api.post(
      `/api/orgs/${orgId}/units/${unitId}/attendance/sessions`,
      body
    );
    return res.data;
  }
);

// 3️⃣ Mark attendance records
export const markAttendanceRecords = createAsyncThunk(
  'orgUnitAttendance/markRecords',
  async ({
    orgId,
    unitId,
    sessionId,
    records,
  }: {
    orgId: string;
    unitId: string;
    sessionId: string;
    records: any[];
  }) => {
    const res = await api.post(
      `/api/orgs/${orgId}/units/${unitId}/attendance/sessions/${sessionId}/records`,
      { records }
    );
    return res.data;
  }
);

// 4️⃣ Get session details
export const fetchAttendanceSession = createAsyncThunk(
  'orgUnitAttendance/fetchSession',
  async ({
    orgId,
    unitId,
    sessionId,
  }: {
    orgId: string;
    unitId: string;
    sessionId: string;
  }) => {
    const res = await api.get(
      `/api/orgs/${orgId}/units/${unitId}/attendance/sessions/${sessionId}`
    );
    return res.data;
  }
);

// 5️⃣ Get self attendance
export const fetchSelfAttendance = createAsyncThunk(
  'orgUnitAttendance/fetchSelf',
  async ({ orgId, unitId }: { orgId: string; unitId: string }) => {
    const res = await api.get(`/api/orgs/${orgId}/units/${unitId}/attendance/self`);
    return res.data;
  }
);

// 6️⃣ Get attendance summary
export const fetchAttendanceSummary = createAsyncThunk(
  'orgUnitAttendance/fetchSummary',
  async ({
    orgId,
    params,
  }: {
    orgId: string;
    params?: Record<string, any>;
  }) => {
    const res = await api.get(`/api/orgs/${orgId}/attendance/summary`, {
      params,
    });
    return res.data;
  }
);

/* ────────────────────────────────
   Slice State
   ──────────────────────────────── */

type Session = {
  id: string;
  date: string;
  topic?: string;
  presentCount?: number;
  totalCount?: number;
  [key: string]: any;
};

interface OrgUnitAttendanceState {
  sessions: Record<string, Session[]>; // key = unitId
  sessionById: Record<string, Session | undefined>;
  selfByUnit: Record<string, any>;
  summaryByOrg: Record<string, any>;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string | null;
}

const initialState: OrgUnitAttendanceState = {
  sessions: {},
  sessionById: {},
  selfByUnit: {},
  summaryByOrg: {},
  status: 'idle',
  error: null,
};

/* ────────────────────────────────
   Slice
   ──────────────────────────────── */

const orgUnitAttendanceSlice = createSlice({
  name: 'orgUnitAttendance',
  initialState,
  reducers: {
    clearAttendanceCache(state, action: PayloadAction<{ orgId?: string }>) {
      state.sessions = {};
      state.sessionById = {};
      state.selfByUnit = {};
      state.summaryByOrg = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // List sessions
      .addCase(fetchAttendanceSessions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAttendanceSessions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { unitId } = (action.meta.arg as any) || {};
        if (unitId) state.sessions[unitId] = action.payload;
      })
      .addCase(fetchAttendanceSessions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to load sessions';
      })
      // Create session
      .addCase(createAttendanceSession.fulfilled, (state, action) => {
        const { unitId } = (action.meta.arg as any) || {};
        if (unitId) state.sessions[unitId]?.unshift(action.payload);
      })
      // Get single session
      .addCase(fetchAttendanceSession.fulfilled, (state, action) => {
        const session = action.payload;
        if (session?.id) state.sessionById[session.id] = session;
      })
      // Self attendance
      .addCase(fetchSelfAttendance.fulfilled, (state, action) => {
        const { unitId } = (action.meta.arg as any) || {};
        if (unitId) state.selfByUnit[unitId] = action.payload;
      })
      // Summary
      .addCase(fetchAttendanceSummary.fulfilled, (state, action) => {
        const { orgId } = (action.meta.arg as any) || {};
        if (orgId) state.summaryByOrg[orgId] = action.payload;
      });
  },
});

/* ────────────────────────────────
   Exports
   ──────────────────────────────── */

export const { clearAttendanceCache } = orgUnitAttendanceSlice.actions;
export default orgUnitAttendanceSlice.reducer;

/* ────────────────────────────────
   Selectors
   ──────────────────────────────── */
export const selectAttendanceSessions = (state: RootState, unitId: string) =>
  state.orgUnitAttendance.sessions[unitId] ?? [];
export const selectAttendanceSession = (state: RootState, sessionId: string) =>
  state.orgUnitAttendance.sessionById[sessionId];
export const selectSelfAttendance = (state: RootState, unitId: string) =>
  state.orgUnitAttendance.selfByUnit[unitId];
export const selectAttendanceSummary = (state: RootState, orgId: string) =>
  state.orgUnitAttendance.summaryByOrg[orgId];
export const selectAttendanceStatus = (state: RootState) =>
  state.orgUnitAttendance.status;
