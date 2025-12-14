import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../api';

/* --------------------------------- Types ---------------------------------- */

export interface Member {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  roleId?: string | null;
  audienceId?: string | null;
  audienceName?: string | null;
  customRoleName?: string | null;
  createdAt: string;
}

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

interface OrgMembersState {
  members: Member[];
  member?: Member | null; // for single fetch
  status: Status;
  memberStatus: Status;
  error: string | null;
}

const initialState: OrgMembersState = {
  members: [],
  member: null,
  status: 'idle',
  memberStatus: 'idle',
  error: null,
};

/* --------------------------------- Thunks --------------------------------- */

// List all members
export const fetchOrgMembers = createAsyncThunk(
  'orgMembers/fetchAll',
  async (p: {
    orgId: string;
    search?: string;
    role?: string;
    roleId?: string;
    audienceId?: string;
    cursor?: string;
    limit?: number;
  }) => {
    const { orgId, ...query } = p;
    const { data } = await api.get(`/api/orgs/${orgId}/members`, {
      params: query,
    });

    // ✅ Normalize backend shape → frontend shape
    const members = (data.data ?? []).map((m: any) => ({
      id: m.id,
      userId: m.userId,
      email: m.user?.email ?? '',
      name: m.user?.name ?? '',
      role: m.role,
      roleId: m.roleId ?? null,
      audienceId: m.audienceId ?? null,
      audienceName: m.audience?.name ?? null, // optional
      customRoleName: m.customerRole?.name ?? null,
      createdAt: m.createdAt,
    }));

    return members;
  }
);

// Create member
export const createOrgMember = createAsyncThunk(
  'orgMembers/create',
  async (p: { orgId: string; body: any }) => {
    const { data } = await api.post<Member>(
      `/api/orgs/${p.orgId}/members`,
      p.body
    );
    return data;
  }
);

// Get single member
export const fetchOrgMember = createAsyncThunk(
  'orgMembers/fetchOne',
  async (p: { orgId: string; memberId: string }) => {
    const { data } = await api.get<Member>(
      `/api/orgs/${p.orgId}/members/${p.memberId}`
    );
    return data;
  }
);

// Update member
export const updateOrgMember = createAsyncThunk(
  'orgMembers/update',
  async (p: { orgId: string; memberId: string; body: any }) => {
    const { data } = await api.patch<Member>(
      `/api/orgs/${p.orgId}/members/${p.memberId}`,
      p.body
    );
    return data;
  }
);

// Delete member
export const deleteOrgMember = createAsyncThunk(
  'orgMembers/delete',
  async (p: { orgId: string; memberId: string }) => {
    await api.delete(`/api/orgs/${p.orgId}/members/${p.memberId}`);
    return p.memberId;
  }
);

/* --------------------------------- Slice ---------------------------------- */

const orgMembersSlice = createSlice({
  name: 'orgMembers',
  initialState,
  reducers: {
    resetMembersState(state) {
      state.status = 'idle';
      state.memberStatus = 'idle';
      state.error = null;
      state.members = [];
      state.member = null;
    },
  },
  extraReducers: (b) => {
    /* -------- list -------- */
    b.addCase(fetchOrgMembers.pending, (s) => {
      s.status = 'loading';
      s.error = null;
    });
    b.addCase(fetchOrgMembers.fulfilled, (s, a) => {
      s.status = 'succeeded';
      s.members = a.payload;
    });
    b.addCase(fetchOrgMembers.rejected, (s, a) => {
      s.status = 'failed';
      s.error = a.error.message ?? 'Failed to load members';
    });

    /* -------- single fetch -------- */
    b.addCase(fetchOrgMember.pending, (s) => {
      s.memberStatus = 'loading';
      s.error = null;
    });
    b.addCase(fetchOrgMember.fulfilled, (s, a) => {
      s.memberStatus = 'succeeded';
      s.member = a.payload;
    });
    b.addCase(fetchOrgMember.rejected, (s, a) => {
      s.memberStatus = 'failed';
      s.error = a.error.message ?? 'Failed to fetch member';
    });

    /* -------- create -------- */
    b.addCase(createOrgMember.fulfilled, (s, a) => {
      s.members.unshift(a.payload);
    });

    /* -------- update -------- */
    b.addCase(updateOrgMember.fulfilled, (s, a) => {
      const idx = s.members.findIndex((m) => m.id === a.payload.id);
      if (idx >= 0) s.members[idx] = a.payload;
      if (s.member?.id === a.payload.id) s.member = a.payload;
    });

    /* -------- delete -------- */
    b.addCase(deleteOrgMember.fulfilled, (s, a) => {
      s.members = s.members.filter((m) => m.id !== a.payload);
      if (s.member?.id === a.payload) s.member = null;
    });
  },
});

export const { resetMembersState } = orgMembersSlice.actions;
export default orgMembersSlice.reducer;

/* -------------------------------- Selectors ------------------------------- */
export const selectOrgMembers = (s: any): Member[] =>
  s.orgMembers?.members ?? [];

export const selectOrgMember = (s: any): Member | null =>
  s.orgMembers?.member ?? null;

export const selectOrgMembersStatus = (s: any): Status =>
  s.orgMembers?.status ?? 'idle';

export const selectOrgMemberStatus = (s: any): Status =>
  s.orgMembers?.memberStatus ?? 'idle';

export const selectOrgMembersError = (s: any): string | null =>
  s.orgMembers?.error ?? null;
