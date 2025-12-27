import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../api';

export type AttendanceSession = {
  id: string;
  orgId: string;
  audienceId: string;
  date: string;
  period: string | null;
  notes?: string | null;
  takenById?: string | null;
  createdAt?: string;
  audience?: { id: string; name: string } | null;
  recordsCount?: number;
  records?: AttendanceRecord[];
};

export type AttendanceRecord = {
  id: string;
  sessionId: string;
  studentId: string;
  status: 'present' | 'absent';
  createdAt?: string;
  student?: { id: string; name: string; email: string };
  session?: {
    id: string;
    audience?: { id: string; name: string };
    date?: string;
  };
};

type Status = 'idle' | 'loading' | 'failed';

type AttendanceState = {
  sessions: AttendanceSession[];
  sessionsNextCursor: string | null;
  session?: AttendanceSession | null;
  history: AttendanceRecord[];
  historyNextCursor: string | null;
  status: Status;
  sessionStatus: Status;
  historyStatus: Status;
  error?: string | null;
};

const initialState: AttendanceState = {
  sessions: [],
  sessionsNextCursor: null,
  session: null,
  history: [],
  historyNextCursor: null,
  status: 'idle',
  sessionStatus: 'idle',
  historyStatus: 'idle',
  error: null,
};

/* ------------------------------ Thunks ------------------------------ */

export const fetchAttendanceSessions = createAsyncThunk(
  'attendance/fetchSessions',
  async (p: {
    orgId: string;
    audienceId: string;
    date?: string;
    limit?: number;
    cursor?: string;
  }) => {
    const { orgId, audienceId, ...params } = p;
    const { data } = await api.get(
      `/api/orgs/${orgId}/audiences/${audienceId}/attendance/sessions`,
      { params }
    );

    return {
      sessions: Array.isArray(data.data)
        ? data.data.map((s: any) => ({
            id: s.id,
            orgId: s.orgId,
            audienceId: s.audienceId,
            audience: s.audience,
            date: s.date,
            period: s.period ?? null,
            notes: s.notes ?? null,
            takenById: s.takenById ?? null,
            createdAt: s.createdAt,
            recordsCount: s.recordsCount,
          }))
        : [],
      nextCursor: data.nextCursor ?? null,
    };
  }
);

export const fetchAttendanceSession = createAsyncThunk(
  'attendance/fetchSession',
  async (p: {
    orgId: string;
    audienceId: string;
    sessionId: string;
    includeRecords?: boolean;
  }) => {
    const { orgId, audienceId, sessionId, includeRecords } = p;
    const { data } = await api.get(
      `/api/orgs/${orgId}/audiences/${audienceId}/attendance/sessions/${sessionId}`,
      { params: { includeRecords } }
    );

    return {
      id: data.id,
      orgId: data.orgId,
      audienceId: data.audienceId,
      audience: data.audience,
      date: data.date,
      period: data.period ?? null,
      notes: data.notes ?? null,
      takenById: data.takenById ?? null,
      createdAt: data.createdAt,
      records: data.records,
    } as AttendanceSession;
  }
);

export const takeAttendance = createAsyncThunk(
  'attendance/take',
  async (p: {
    orgId: string;
    audienceId: string;
    body: {
      date: string;
      period?: string | null;
      notes?: string;
      takenById?: string;
      records: { studentId: string; status: 'present' | 'absent' }[];
    };
  }) => {
    const { orgId, audienceId, body } = p;
    const { data } = await api.post(
      `/api/orgs/${orgId}/audiences/${audienceId}/attendance/take`,
      body
    );

    return {
      session: {
        id: data.session.id,
        orgId: data.session.orgId,
        audienceId: data.session.audienceId,
        audience: data.session.audience,
        date: data.session.date,
        period: data.session.period ?? null,
        notes: data.session.notes ?? null,
        takenById: data.session.takenById ?? null,
        createdAt: data.session.createdAt,
      },
      records: data.records as AttendanceRecord[],
    };
  }
);

export const updateAttendanceNotes = createAsyncThunk(
  'attendance/updateNotes',
  async (p: {
    orgId: string;
    audienceId: string;
    sessionId: string;
    notes?: string | null;
  }) => {
    const { orgId, audienceId, sessionId, notes } = p;
    const { data } = await api.put(
      `/api/orgs/${orgId}/audiences/${audienceId}/attendance/sessions/${sessionId}/notes`,
      { notes }
    );
    return data as AttendanceSession;
  }
);

export const updateAttendanceRecord = createAsyncThunk(
  'attendance/updateRecord',
  async (p: {
    orgId: string;
    audienceId: string;
    sessionId: string;
    studentId: string;
    status: 'present' | 'absent';
  }) => {
    const { orgId, audienceId, sessionId, studentId, status } = p;
    const { data } = await api.put(
      `/api/orgs/${orgId}/audiences/${audienceId}/attendance/sessions/${sessionId}/students/${studentId}`,
      { status }
    );
    return data as AttendanceRecord;
  }
);

export const fetchStudentAttendanceHistory = createAsyncThunk(
  'attendance/fetchHistory',
  async (p: {
    orgId: string;
    studentId: string;
    from?: string;
    to?: string;
    limit?: number;
    cursor?: string;
  }) => {
    const { orgId, studentId, ...params } = p;
    const { data } = await api.get(
      `/api/orgs/${orgId}/students/${studentId}/attendance/history`,
      { params }
    );

    return {
      records: Array.isArray(data.data) ? data.data : [],
      nextCursor: data.nextCursor ?? null,
    };
  }
);

/* ------------------------------ Slice ------------------------------ */

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearAttendanceState(state) {
      state.sessions = [];
      state.sessionsNextCursor = null;
      state.session = null;
      state.history = [];
      state.historyNextCursor = null;
      state.status = 'idle';
      state.sessionStatus = 'idle';
      state.historyStatus = 'idle';
      state.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchAttendanceSessions.pending, (s) => {
      s.status = 'loading';
      s.error = null;
    });
    b.addCase(fetchAttendanceSessions.fulfilled, (s, a) => {
      s.status = 'idle';
      s.sessions = a.payload.sessions;
      s.sessionsNextCursor = a.payload.nextCursor;
    });
    b.addCase(fetchAttendanceSessions.rejected, (s, a) => {
      s.status = 'failed';
      s.error = a.error.message ?? 'Failed to load attendance sessions';
    });

    b.addCase(fetchAttendanceSession.pending, (s) => {
      s.sessionStatus = 'loading';
      s.error = null;
    });
    b.addCase(fetchAttendanceSession.fulfilled, (s, a) => {
      s.sessionStatus = 'idle';
      s.session = a.payload;
    });
    b.addCase(fetchAttendanceSession.rejected, (s, a) => {
      s.sessionStatus = 'failed';
      s.error = a.error.message ?? 'Failed to load attendance session';
    });

    b.addCase(takeAttendance.fulfilled, (s, a) => {
      if (a.payload.session) {
        // upsert into sessions list
        const idx = s.sessions.findIndex((x) => x.id === a.payload.session.id);
        if (idx >= 0) s.sessions[idx] = a.payload.session;
        else s.sessions.unshift(a.payload.session);
        s.session = a.payload.session;
      }
    });

    b.addCase(updateAttendanceNotes.fulfilled, (s, a) => {
      // update current session and list entry
      s.session = a.payload;
      const idx = s.sessions.findIndex((x) => x.id === a.payload.id);
      if (idx >= 0) s.sessions[idx] = a.payload;
    });

    b.addCase(updateAttendanceRecord.fulfilled, (s, a) => {
      if (s.session?.records) {
        const idx = s.session.records.findIndex(
          (r) => r.studentId === a.payload.studentId
        );
        if (idx >= 0) s.session.records[idx] = a.payload as any;
      }
    });

    b.addCase(fetchStudentAttendanceHistory.pending, (s) => {
      s.historyStatus = 'loading';
      s.error = null;
    });
    b.addCase(fetchStudentAttendanceHistory.fulfilled, (s, a) => {
      s.historyStatus = 'idle';
      s.history = a.payload.records as any;
      s.historyNextCursor = a.payload.nextCursor;
    });
    b.addCase(fetchStudentAttendanceHistory.rejected, (s, a) => {
      s.historyStatus = 'failed';
      s.error = a.error.message ?? 'Failed to load attendance history';
    });
  },
});

export const { clearAttendanceState } = attendanceSlice.actions;
export default attendanceSlice.reducer;

/* ------------------------------ Selectors ------------------------------ */
export const selectAttendanceSessions = (s: any): AttendanceSession[] =>
  s.attendance?.sessions ?? [];
export const selectAttendanceSession = (s: any): AttendanceSession | null =>
  s.attendance?.session ?? null;
export const selectAttendanceHistory = (s: any): AttendanceRecord[] =>
  s.attendance?.history ?? [];
export const selectAttendanceStatus = (s: any): Status =>
  s.attendance?.status ?? 'idle';
export const selectAttendanceSessionStatus = (s: any): Status =>
  s.attendance?.sessionStatus ?? 'idle';
export const selectAttendanceHistoryStatus = (s: any): Status =>
  s.attendance?.historyStatus ?? 'idle';
export const selectAttendanceError = (s: any): string | null =>
  s.attendance?.error ?? null;
