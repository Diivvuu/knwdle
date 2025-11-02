import {
  createAction,
  createAsyncThunk,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';
import { api } from '../api';
import { ParentRole } from './roles';

export interface Invite {
  id: string;
  orgId: string;
  email: string;
  role: ParentRole;
  roleId: string | null;
  unitId: string | null;
  token: string | null;
  joinCode: string | null;
  expiresAt: string;
  acceptedBy: string | null;
  createdAt: string;
  meta?: Record<string, any> | null;
}

export interface BulkInviteItem {
  email: string;
  role?: ParentRole;
  roleId?: string;
  unitId?: string;
  meta?: Record<string, any>;
}

export interface BulkInviteOptions {
  expiresInDays?: number;
  sendEmail?: boolean;
  dryRun?: boolean;
}

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

export type BulkBatchProgress = {
  batchId: string;
  status: 'queued' | 'running' | 'done' | 'error' | 'canceled';
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  message?: string;
};

export interface InviteState {
  byOrg: Record<
    string,
    {
      status: Status;
      items: Invite[];
      nextCursor: string | null;
      hasMore: boolean;
      error?: string;
    }
  >;

  createStatus: Status;
  createError?: string;

  deleteStatusById: Record<string, Status>;

  acceptByCodeStatus: Status;
  acceptByCodeError?: string;

  // bulk batch (new model)
  bulkStatus: Status;
  bulkError?: string;

  // info from post/bulk (batch created)
  currentBatch?: {
    orgId: string;
    batchId: string;
    total: number;
    status: 'queued' | 'running' | 'done' | 'error';
  };

  //live progress
  bulkProgress?: BulkBatchProgress;

  // legacy result holder
  bulkResult?: {
    total: number;
    sent: number;
    failed: number;
    skipped: number;
  };
}

const initialState: InviteState = {
  byOrg: {},
  createStatus: 'idle',
  deleteStatusById: {},
  acceptByCodeStatus: 'idle',
  bulkStatus: 'idle',
};

// thunks list/create/delete
export const listInvitesPage = createAsyncThunk<
  {
    orgId: string;
    items: Invite[];
    nextCursor: string | null;
    // echo back params so UI can know what it fetched for
    fetchedFor: {
      limit: number;
      cursor: string | null;
      q?: string;
      role?: ParentRole;
      status?: 'pending' | 'accepted';
      unitId?: string;
      sortKey?: string;
      sortDir?: 'asc' | 'desc';
    };
  },
  {
    orgId: string;
    limit?: number;
    cursor?: string | null;
    q?: string;
    role?: ParentRole;
    status?: 'pending' | 'accepted';
    unitId?: string;
    sortKey?: string;
    sortDir?: 'asc' | 'desc';
  }
>(
  'invites/listPage',
  async ({
    orgId,
    limit = 25,
    cursor = null,
    q,
    role,
    status,
    unitId,
    sortKey,
    sortDir,
  }) => {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    if (cursor) params.set('cursor', cursor);
    if (q) params.set('q', q);
    if (role) params.set('role', role);
    if (status) params.set('status', status);
    if (unitId) params.set('unitId', unitId);
    if (sortKey) params.set('sortKey', sortKey);
    if (sortDir) params.set('sortDir', sortDir);

    const { data } = await api.get(
      `/api/orgs/${orgId}/invites?${params.toString()}`
    );

    return {
      orgId,
      items: data.items as Invite[],
      nextCursor: (data.nextCursor as string) ?? null,
      fetchedFor: { limit, cursor, q, role, status, unitId, sortKey, sortDir },
    };
  }
);

export const createInvite = createAsyncThunk<
  Invite,
  {
    orgId: string;
    email: string;
    role?: ParentRole;
    roleId?: string;
    unitId?: string;
    meta?: Record<string, any>;
  },
  { rejectValue: string }
>('invites/create', async ({ orgId, ...body }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/api/orgs/${orgId}/invites`, body);
    return data as Invite;
  } catch (error: any) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      'Failed to send invite';
    return rejectWithValue(message);
  }
});

export const resetCreateInviteStatus = createAction(
  'invites/resetCreateInviteStatus'
);

export const deleteInvite = createAsyncThunk<
  { orgId: string; inviteId: string },
  { orgId: string; inviteId: string },
  { rejectValue: string }
>('invites/delete', async ({ orgId, inviteId }, { rejectWithValue }) => {
  try {
    await api.delete(`/api/orgs/${orgId}/invites/${inviteId}`);
    return { orgId, inviteId };
  } catch (error: any) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      'Failed to delete invite';
    return rejectWithValue(message);
  }
});

// thunks

export const acceptInviteByJoinCode = createAsyncThunk<
  { message: string; orgId?: string; unitId?: string },
  { code: string }
>('invites/acceptByCode', async ({ code }) => {
  const { data } = await api.post(`/api/invites/join-code`, { code });
  return data as { message: string; orgId?: string; unitId?: string };
});

//bulk thunks
export const startBulkInvite = createAsyncThunk<
  {
    batchId: string;
    total: number;
    status: 'queued' | 'running' | 'done';
    orgId: string;
  },
  { orgId: string; invites: BulkInviteItem[]; options?: BulkInviteOptions }
>('invites/bulk/start', async ({ orgId, invites, options }) => {
  const { data } = await api.post(`/api/orgs/${orgId}/invites/bulk`, {
    invites,
    options,
  });
  return { ...data, orgId } as {
    batchId: string;
    total: number;
    status: 'queued' | 'running' | 'done';
    orgId: string;
  };
});

// poll current batch status
export const getBulkStatus = createAsyncThunk<
  BulkBatchProgress,
  { orgId: string; batchId: string }
>('invites/bulk/status', async ({ orgId, batchId }) => {
  const { data } = await api.get(
    `/api/orgs/${orgId}/invites/bulk/${batchId}/status`
  );
  const payload: BulkBatchProgress = {
    batchId,
    status: data.status,
    total: data.total,
    sent: data.sent,
    failed: data.failed,
    skipped: data.skipped,
  };
  return payload;
});

let bulkES: EventSource | null = null;

export const streamBulkInvite = createAsyncThunk<
  void,
  { orgId: string; batchId: string }
>(
  'invites/bulk/stream',
  async ({ orgId, batchId }, { dispatch, rejectWithValue }) => {
    if (typeof window === 'undefined') return;

    try {
      bulkES?.close();
    } catch {}
    bulkES = null;

    const base = (api.defaults.baseURL ?? '').replace(/\/$/, '');
    const url = base
      ? `${base}/api/orgs/${orgId}/invites/bulk/${batchId}/stream`
      : `/api/orgs/${orgId}/invites/bulk/${batchId}/stream`;
    const es = new EventSource(url, { withCredentials: true });
    bulkES = es;

    es.addEventListener('progress', (evt: MessageEvent) => {
      try {
        const p = JSON.parse(evt.data);
        dispatch(
          bulkProgressReceived({
            batchId,
            status: 'running',
            total: p.total,
            sent: p.sent,
            failed: p.failed,
            skipped: p.skipped,
          })
        );
      } catch {}
    });
    es.addEventListener('done', (evt: MessageEvent) => {
      try {
        const p = JSON.parse(evt.data);
        dispatch(
          bulkProgressReceived({
            batchId,
            status: 'done',
            total: p.total,
            sent: p.sent,
            failed: p.failed,
            skipped: p.skipped,
          })
        );
        dispatch(bulkStreamClosed());
      } catch {}
      try {
        es.close();
      } catch {}
    });

    es.addEventListener('error', (evt: MessageEvent) => {
      try {
        const p = evt?.data ? JSON.parse(evt.data) : undefined;
        dispatch(
          bulkProgressReceived({
            batchId,
            status: 'error',
            total: p?.total ?? 0,
            sent: p?.sent ?? 0,
            failed: p?.failed ?? 0,
            skipped: p?.skipped ?? 0,
            message: p?.message ?? 'bulk send error',
          })
        );
      } catch {
        dispatch(
          bulkProgressReceived({
            batchId,
            status: 'error',
            total: 0,
            sent: 0,
            failed: 0,
            skipped: 0,
            message: 'bulk send error',
          })
        );
      }
      dispatch(bulkStreamClosed());
      try {
        es.close();
      } catch {}
    });
  }
);

export const stopBulkStream = createAsyncThunk<void, void>(
  'invites/bulk/stopStream',
  async (_, { dispatch }) => {
    try {
      bulkES?.close();
    } catch {}
    bulkES = null;
    dispatch(bulkStreamClosed());
  }
);

const invitesSlice = createSlice({
  name: 'invites',
  initialState,
  reducers: {
    clearOrgInvites(state, action: PayloadAction<{ orgId: string }>) {
      state.byOrg[action.payload.orgId] = {
        status: 'idle',
        items: [],
        nextCursor: null,
        hasMore: true,
      };
    },

    /** internal: progress tick from SSE/poll */
    bulkProgressReceived(state, action: PayloadAction<BulkBatchProgress>) {
      state.bulkProgress = action.payload;
      // If “done”, also populate legacy bulkResult for existing UIs
      if (action.payload.status === 'done') {
        state.bulkResult = {
          total: action.payload.total,
          sent: action.payload.sent,
          failed: action.payload.failed,
          skipped: action.payload.skipped,
        };
      }
    },
    bulkStreamClosed(state) {
      // no-op marker; keep last progress for UI
    },
    clearBulkResult(state) {
      state.bulkResult = undefined;
      state.bulkStatus = 'idle';
      state.bulkError = undefined;
      state.bulkProgress = undefined;
      state.currentBatch = undefined;
    },
  },
  extraReducers: (b) => {
    /* list */
    b.addCase(listInvitesPage.pending, (s, a) => {
      const { orgId } = a.meta.arg;
      const entry = s.byOrg[orgId] || {
        status: 'idle',
        items: [],
        nextCursor: null,
        hasMore: true,
      };
      entry.status = 'loading';
      entry.error = undefined;
      s.byOrg[orgId] = entry;
    });
    b.addCase(listInvitesPage.fulfilled, (s, a) => {
      const { orgId, items, nextCursor } = a.payload;
      const prev = s.byOrg[orgId] ?? {
        status: 'idle',
        items: [],
        nextCursor: null,
        hasMore: true,
      };
      const merged = [...prev.items, ...items];
      const seen = new Set<string>();
      const dedup = merged.filter((i) =>
        seen.has(i.id) ? false : (seen.add(i.id), true)
      );

      s.byOrg[orgId] = {
        status: 'succeeded',
        items: dedup,
        nextCursor,
        hasMore: Boolean(nextCursor),
      };
    });

    b.addCase(listInvitesPage.rejected, (s, a) => {
      const { orgId } = a.meta.arg;
      const entry = s.byOrg[orgId] || {
        status: 'idle',
        items: [],
        nextCursor: null,
        hasMore: true,
      };
      entry.status = 'failed';
      entry.error = a.error.message;
      s.byOrg[orgId] = entry;
    });

    /* create */
    b.addCase(createInvite.pending, (s) => {
      s.createStatus = 'loading';
      s.createError = undefined;
    });
    b.addCase(createInvite.fulfilled, (s, a) => {
      s.createStatus = 'succeeded';
      const inv = a.payload;
      const prev = s.byOrg[inv.orgId] ?? {
        status: 'idle',
        items: [],
        nextCursor: null,
        hasMore: true,
      };
      s.byOrg[inv.orgId] = {
        ...prev,
        items: [inv, ...prev.items],
      };
    });
    b.addCase(createInvite.rejected, (s, a) => {
      s.createStatus = 'failed';
      s.createError =
        (a.payload as string) || a.error.message || 'Failed to send invite';
    });

    // reset create invite
    b.addCase(resetCreateInviteStatus, (s) => {
      s.createStatus = 'idle';
      s.createError = undefined;
    });

    /* delete */
    b.addCase(deleteInvite.pending, (s, a) => {
      const { inviteId } = a.meta.arg;
      s.deleteStatusById[inviteId] = 'loading';
    });
    b.addCase(deleteInvite.fulfilled, (s, a) => {
      const { orgId, inviteId } = a.payload;
      s.deleteStatusById[inviteId] = 'succeeded';
      const entry = s.byOrg[orgId];
      if (entry) entry.items = entry.items.filter((i) => i.id !== inviteId);
    });
    b.addCase(deleteInvite.rejected, (s, a) => {
      const { inviteId } = a.meta.arg;
      s.deleteStatusById[inviteId] = 'failed';
    });

    /* accept by join code (payload fix) */
    b.addCase(acceptInviteByJoinCode.pending, (s) => {
      s.acceptByCodeStatus = 'loading';
      s.acceptByCodeError = undefined;
    });
    b.addCase(acceptInviteByJoinCode.fulfilled, (s) => {
      s.acceptByCodeStatus = 'succeeded';
    });
    b.addCase(acceptInviteByJoinCode.rejected, (s, a) => {
      s.acceptByCodeStatus = 'failed';
      s.acceptByCodeError = a.error.message;
    });

    /* bulk: start */
    b.addCase(startBulkInvite.pending, (s) => {
      s.bulkStatus = 'loading';
      s.bulkError = undefined;
      s.bulkProgress = undefined;
      s.bulkResult = undefined;
      s.currentBatch = undefined;
    });
    b.addCase(startBulkInvite.fulfilled, (s, a) => {
      s.bulkStatus = 'succeeded';
      s.currentBatch = {
        orgId: a.payload.orgId,
        batchId: a.payload.batchId,
        total: a.payload.total,
        status: a.payload.status,
      };
      // If backend returned already done (e.g., dryRun or sendEmail=false), synthesize done
      if (a.payload.status === 'done') {
        s.bulkProgress = {
          batchId: a.payload.batchId,
          status: 'done',
          total: a.payload.total,
          sent: 0,
          failed: 0,
          skipped: 0,
        };
        s.bulkResult = {
          total: a.payload.total,
          sent: 0,
          failed: 0,
          skipped: 0,
        };
      }
    });
    b.addCase(startBulkInvite.rejected, (s, a) => {
      s.bulkStatus = 'failed';
      s.bulkError = a.error.message;
    });

    /* bulk: status poll */
    b.addCase(getBulkStatus.fulfilled, (s, a) => {
      s.bulkProgress = a.payload;
      if (a.payload.status === 'done') {
        s.bulkResult = {
          total: a.payload.total,
          sent: a.payload.sent,
          failed: a.payload.failed,
          skipped: a.payload.skipped,
        };
      }
    });
  },
});
export const {
  clearOrgInvites,
  clearBulkResult,
  bulkProgressReceived,
  bulkStreamClosed,
} = invitesSlice.actions;
export default invitesSlice.reducer;
