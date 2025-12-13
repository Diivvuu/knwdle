import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../api';
import { RootState } from '../types';

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface TimetableEntry {
  id: string;
  orgId: string;
  unitId: string;
  subjectId?: string | null;
  teacherId?: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string | null;
  mode?: string | null;
  subject?: { id: string; name: string } | null;
  teacher?: { id: string; name: string } | null;
}

/* --------------------------------- Thunks --------------------------------- */

// GET /api/orgs/:orgId/units/:unitId/timetable
export const fetchUnitTimetable = createAsyncThunk(
  'orgUnitTimetable/fetchAll',
  async (p: { orgId: string; unitId: string }) => {
    const { data } = await api.get<TimetableEntry[]>(
      `/api/orgs/${p.orgId}/units/${p.unitId}/timetable`
    );
    return data;
  }
);

// GET /api/orgs/:orgId/units/:unitId/timetable/today
export const fetchUnitTimetableToday = createAsyncThunk(
  'orgUnitTimetable/fetchToday',
  async (p: { orgId: string; unitId: string }) => {
    const { data } = await api.get<TimetableEntry[]>(
      `/api/orgs/${p.orgId}/units/${p.unitId}/timetable/today`
    );
    return data;
  }
);

// POST /api/orgs/:orgId/units/:unitId/timetable
export const createUnitTimetableEntry = createAsyncThunk(
  'orgUnitTimetable/create',
  async (p: { orgId: string; unitId: string; body: Partial<TimetableEntry> }) => {
    const { data } = await api.post<TimetableEntry>(
      `/api/orgs/${p.orgId}/units/${p.unitId}/timetable`,
      p.body
    );
    return data;
  }
);

// PUT /api/orgs/:orgId/units/:unitId/timetable/:id
export const updateUnitTimetableEntry = createAsyncThunk(
  'orgUnitTimetable/update',
  async (p: {
    orgId: string;
    unitId: string;
    id: string;
    body: Partial<TimetableEntry>;
  }) => {
    const { data } = await api.put<TimetableEntry>(
      `/api/orgs/${p.orgId}/units/${p.unitId}/timetable/${p.id}`,
      p.body
    );
    return data;
  }
);

// DELETE /api/orgs/:orgId/units/:unitId/timetable/:id
export const deleteUnitTimetableEntry = createAsyncThunk(
  'orgUnitTimetable/delete',
  async (p: { orgId: string; unitId: string; id: string }) => {
    await api.delete(`/api/orgs/${p.orgId}/units/${p.unitId}/timetable/${p.id}`);
    return { id: p.id, unitId: p.unitId };
  }
);

/* ---------------------------------- Slice --------------------------------- */

interface OrgUnitTimetableState {
  entriesByUnit: Record<string, TimetableEntry[]>;
  todayByUnit: Record<string, TimetableEntry[]>;
  status: Status;
  mutateStatus: Status;
  error?: string | null;
  mutateError?: string | null;
}

const initialState: OrgUnitTimetableState = {
  entriesByUnit: {},
  todayByUnit: {},
  status: 'idle',
  mutateStatus: 'idle',
  error: null,
  mutateError: null,
};

const orgUnitTimetableSlice = createSlice({
  name: 'orgUnitTimetable',
  initialState,
  reducers: {
    resetOrgUnitTimetableState(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (b) => {
    /* ----------------------------- Fetch all slots ---------------------------- */
    b.addCase(fetchUnitTimetable.pending, (s) => {
      s.status = 'loading';
      s.error = null;
    });
    b.addCase(fetchUnitTimetable.fulfilled, (s, a) => {
      s.status = 'succeeded';
      const { unitId } = (a.meta.arg as any) || {};
      if (unitId) s.entriesByUnit[unitId] = a.payload;
    });
    b.addCase(fetchUnitTimetable.rejected, (s, a) => {
      s.status = 'failed';
      s.error = a.error.message ?? 'Failed to load timetable';
    });

    /* ----------------------------- Fetch today only --------------------------- */
    b.addCase(fetchUnitTimetableToday.pending, (s) => {
      s.status = 'loading';
      s.error = null;
    });
    b.addCase(fetchUnitTimetableToday.fulfilled, (s, a) => {
      s.status = 'succeeded';
      const { unitId } = (a.meta.arg as any) || {};
      if (unitId) s.todayByUnit[unitId] = a.payload;
    });
    b.addCase(fetchUnitTimetableToday.rejected, (s, a) => {
      s.status = 'failed';
      s.error = a.error.message ?? 'Failed to load today\'s timetable';
    });

    /* ----------------------------- Create entry ------------------------------ */
    b.addCase(createUnitTimetableEntry.pending, (s) => {
      s.mutateStatus = 'loading';
      s.mutateError = null;
    });
    b.addCase(createUnitTimetableEntry.fulfilled, (s, a) => {
      s.mutateStatus = 'succeeded';
      const entry = a.payload;
      if (entry?.unitId) {
        const list = s.entriesByUnit[entry.unitId] ?? [];
        s.entriesByUnit[entry.unitId] = [entry, ...list];
      }
    });
    b.addCase(createUnitTimetableEntry.rejected, (s, a) => {
      s.mutateStatus = 'failed';
      s.mutateError = a.error.message ?? 'Failed to create timetable entry';
    });

    /* ----------------------------- Update entry ------------------------------ */
    b.addCase(updateUnitTimetableEntry.pending, (s) => {
      s.mutateStatus = 'loading';
      s.mutateError = null;
    });
    b.addCase(updateUnitTimetableEntry.fulfilled, (s, a) => {
      s.mutateStatus = 'succeeded';
      const entry = a.payload;
      const unitId = entry?.unitId || (a.meta.arg as any)?.unitId;
      if (entry && unitId && s.entriesByUnit[unitId]) {
        s.entriesByUnit[unitId] = s.entriesByUnit[unitId].map((e) =>
          e.id === entry.id ? entry : e
        );
      }
    });
    b.addCase(updateUnitTimetableEntry.rejected, (s, a) => {
      s.mutateStatus = 'failed';
      s.mutateError = a.error.message ?? 'Failed to update timetable entry';
    });

    /* ----------------------------- Delete entry ------------------------------ */
    b.addCase(deleteUnitTimetableEntry.pending, (s) => {
      s.mutateStatus = 'loading';
      s.mutateError = null;
    });
    b.addCase(deleteUnitTimetableEntry.fulfilled, (s, a) => {
      s.mutateStatus = 'succeeded';
      const { unitId, id } = a.payload;
      if (unitId && id && s.entriesByUnit[unitId]) {
        s.entriesByUnit[unitId] = s.entriesByUnit[unitId].filter(
          (entry) => entry.id !== id
        );
      }
    });
    b.addCase(deleteUnitTimetableEntry.rejected, (s, a) => {
      s.mutateStatus = 'failed';
      s.mutateError = a.error.message ?? 'Failed to delete timetable entry';
    });
  },
});

export const { resetOrgUnitTimetableState } = orgUnitTimetableSlice.actions;
export default orgUnitTimetableSlice.reducer;

/* -------------------------------- Selectors -------------------------------- */

export const selectUnitTimetableEntries = (state: RootState, unitId: string) =>
  (state.orgUnitTimetable?.entriesByUnit || {})[unitId] ?? [];
export const selectUnitTimetableToday = (state: RootState, unitId: string) =>
  (state.orgUnitTimetable?.todayByUnit || {})[unitId] ?? [];
export const selectUnitTimetableStatus = (state: RootState): Status =>
  state.orgUnitTimetable?.status ?? 'idle';
export const selectUnitTimetableMutateStatus = (state: RootState): Status =>
  state.orgUnitTimetable?.mutateStatus ?? 'idle';
export const selectUnitTimetableError = (state: RootState): string | null =>
  state.orgUnitTimetable?.error ?? null;
export const selectUnitTimetableMutateError = (state: RootState): string | null =>
  state.orgUnitTimetable?.mutateError ?? null;
