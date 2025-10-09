import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../api';
import { ParentRole } from './org';

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
  role: ParentRole;
  roleId?: string;
  unitId?: string;
  meta?: Record<string, any>;
}

export interface BulkInviteOptions {
  expiresInDays?: number;
  sendEmail?: boolean;
  dryRun?: boolean;
}

export type BulkInviteResultItem = {
  input: BulkInviteItem;
  status: 'skipped-exists' | 'created' | 'dry-run' | 'error';
  id?: string;
  message?: string;
};

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface InvitesState {
  byOrg: Record<
    string,
    {
      status: Status;
      items: Invite[];
      error?: string;
    }
  >;
  createStatus: Status;
  createError?: string;

  deleteStatusById: Record<string, Status>;

  acceptByTokenStatus: Status;
  acceptByTokenError?: string;

  acceptByCodeStatus: Status;
  acceptByCodeError?: string;

  bulkStatus: Status;
  bulkError?: string;
  bulkResult?: {
    count: number;
    results: BulkInviteResultItem[];
  };
}

const initialState: InvitesState = {
  byOrg: {},
  createStatus: 'idle',
  deleteStatusById: {},
  acceptByTokenStatus: 'idle',
  acceptByCodeStatus: 'idle',
  bulkStatus: 'idle',
};

// get org invites
export const listInvites = createAsyncThunk<Invite[], { orgId: string }>(
  'invites/list',
  async ({ orgId }) => {
    const { data } = await api.get(`/api/orgs/${orgId}/invites`);
    return data as Invite[];
  }
);

// post invite
export const createInvite = createAsyncThunk<
  Invite,
  {
    orgId: string;
    email: string;
    role?: ParentRole;
    roleId?: string;
    unitId?: string;
    meta?: Record<string, any>;
  }
>('invites/create', async ({ orgId, ...body }) => {
  const { data } = await api.post(`/api/orgs/${orgId}/invites`, body);
  return data as Invite;
});

// delete invite
export const deleteInvite = createAsyncThunk<
  { orgId: string; inviteId: string },
  { orgId: string; inviteId: string }
>('invites/delete', async ({ orgId, inviteId }) => {
  await api.delete(`/api/orgs/${orgId}/invites/${inviteId}`);
  return { orgId, inviteId };
});

// post accept invite by token
// export const acceptInviteByToken = createAsyncThunk<
//   { message: string },
//   { token: string }
// >('invites/acceptByToken', async ({ token }) => {
//   const { data } = await api.post(`/api/invites/${token}/accept`);
//   return data as { message: string };
// });

// post accept invite by join code
export const acceptInviteByJoinCode = createAsyncThunk<
  { message: string },
  { code: string; email: string }
>('invites/acceptByCode', async ({ code, email }) => {
  const { data } = await api.post(`/api/invites/join-code`, { code, email });
  return data as { message: string };
});

// post bulk invites
export const bulkInvite = createAsyncThunk<
  { count: number; results: BulkInviteResultItem[] },
  { orgId: string; invites: BulkInviteItem[]; options?: BulkInviteOptions }
>('invites/bulk', async ({ orgId, invites, options }) => {
  const { data } = await api.post(`/api/orgs/${orgId}/invites/bulk`, {
    invites,
    options,
  });
  return data as { count: number; results: BulkInviteResultItem[] };
});

// slices
const invitesSlice = createSlice({
  name: 'invites',
  initialState,
  reducers: {
    clearOrgInvites(state, action: PayloadAction<{ orgId: string }>) {
      delete state.byOrg[action.payload.orgId];
    },
    clearBulkResult(state) {
      state.bulkResult = undefined;
      state.bulkStatus = 'idle';
      state.bulkError = undefined;
    },
  },
  extraReducers: (b) => {
    //list
    b.addCase(listInvites.pending, (s, a) => {
      const orgId = a.meta.arg.orgId;
      s.byOrg[orgId] = s.byOrg[orgId] || { status: 'idle', items: [] };
      s.byOrg[orgId].status = 'loading';
      s.byOrg[orgId].error = undefined;
    });
    b.addCase(listInvites.fulfilled, (s, a) => {
      const orgId = a.meta.arg.orgId;
      s.byOrg[orgId] = { status: 'succeeded', items: a.payload };
    });
    b.addCase(listInvites.rejected, (s, a) => {
      const orgId = a.meta.arg.orgId;
      s.byOrg[orgId] = s.byOrg[orgId] || { status: 'idle', items: [] };
      s.byOrg[orgId].status = 'failed';
      s.byOrg[orgId].error = a.error.message;
    });

    //create
    b.addCase(createInvite.pending, (s) => {
      s.createStatus = 'loading';
      s.createError = undefined;
    });
    b.addCase(createInvite.fulfilled, (s, a) => {
      s.createStatus = 'succeeded';
      const inv = a.payload;
      const entry = s.byOrg[inv.orgId] || { status: 'idle', items: [] };
      entry.items = [inv, ...(entry.items || [])];
      s.byOrg[inv.orgId] = entry;
    });
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

    //accept by token
    // b.addCase(acceptInviteByToken.pending, (s) => {
    //   s.acceptByTokenStatus = 'loading';
    //   s.acceptByTokenError = undefined;
    // });
    // b.addCase(acceptInviteByToken.fulfilled, (s) => {
    //   s.acceptByTokenStatus = 'succeeded';
    // });
    // b.addCase(acceptInviteByToken.rejected, (s, a) => {
    //   s.acceptByTokenStatus = 'failed';
    //   s.acceptByTokenError = a.error.message;
    // });

    //accept by code
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

    //bulk
    b.addCase(bulkInvite.pending, (s) => {
      s.bulkStatus = 'loading';
      s.bulkError = undefined;
      s.bulkResult = undefined;
    });
    b.addCase(bulkInvite.fulfilled, (s, a) => {
      s.bulkStatus = 'succeeded';
      s.bulkResult = a.payload;
    });
    b.addCase(bulkInvite.rejected, (s, a) => {
      s.bulkStatus = 'failed';
      s.bulkError = a.error.message;
    });
  },
});

const { clearOrgInvites, clearBulkResult } = invitesSlice.actions;
export default invitesSlice.reducer;
