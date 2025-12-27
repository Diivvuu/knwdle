import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../api';

/* --------------------------------- Types ---------------------------------- */

export interface Member {
  userId: string;
  email: string;
  name: string;
  orgRole: string | null;
  roleId?: string | null;
  audienceId?: string | null;
  audiences: { id: string; name: string }[];
  createdAt?: string;
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
    excludeAudienceId?: string;
  }) => {
    const { orgId, ...query } = p;
    const { data } = await api.get(`/api/orgs/${orgId}/members`, {
      params: query,
    });

    const payload = Array.isArray(data.data) ? data.data : [];

    const rows: Member[] = payload.map((u: any) => ({
      userId: u.userId,
      email: u.email ?? '',
      name: u.name ?? '',
      orgRole: u.orgRole ?? null,
      roleId: u.roleId ?? null,
      audienceId: null,
      audiences: Array.isArray(u.audiences) ? u.audiences : [],
    }));

    return rows;
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
    return {
      userId: (data as any)?.userId ?? (data as any)?.user?.id ?? '',
      email: (data as any)?.email ?? (data as any)?.user?.email ?? '',
      name: (data as any)?.name ?? (data as any)?.user?.name ?? '',
      orgRole: (data as any)?.role ?? null,
      roleId: (data as any)?.roleId ?? null,
      audienceId: (data as any)?.audienceId ?? null,
      audiences:
        (data as any)?.audiences ??
        ((data as any)?.audience
          ? [{ id: (data as any).audience.id, name: (data as any).audience.name }]
          : []),
    } as Member;
  }
);

// Get single member
export const fetchOrgMember = createAsyncThunk(
  'orgMembers/fetchOne',
  async (p: { orgId: string; memberId: string }) => {
    const { data } = await api.get<Member>(
      `/api/orgs/${p.orgId}/members/${p.memberId}`
    );
    return {
      userId: (data as any)?.userId ?? (data as any)?.user?.id ?? '',
      email: (data as any)?.email ?? (data as any)?.user?.email ?? '',
      name: (data as any)?.name ?? (data as any)?.user?.name ?? '',
      orgRole: (data as any)?.role ?? null,
      roleId: (data as any)?.roleId ?? null,
      audienceId: (data as any)?.audienceId ?? null,
      audiences:
        (data as any)?.audiences ??
        ((data as any)?.audience
          ? [{ id: (data as any).audience.id, name: (data as any).audience.name }]
          : []),
    } as Member;
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
    return {
      userId: (data as any)?.userId ?? (data as any)?.user?.id ?? '',
      email: (data as any)?.email ?? (data as any)?.user?.email ?? '',
      name: (data as any)?.name ?? (data as any)?.user?.name ?? '',
      orgRole: (data as any)?.role ?? null,
      roleId: (data as any)?.roleId ?? null,
      audienceId: (data as any)?.audienceId ?? null,
      audiences:
        (data as any)?.audiences ??
        ((data as any)?.audience
          ? [{ id: (data as any).audience.id, name: (data as any).audience.name }]
          : []),
    } as Member;
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
      const idx = s.members.findIndex((m) => m.userId === a.payload.userId);
      if (idx >= 0) s.members[idx] = a.payload;
      else s.members.unshift(a.payload);
    });

    /* -------- update -------- */
    b.addCase(updateOrgMember.fulfilled, (s, a) => {
      const idx = s.members.findIndex((m) => m.userId === a.payload.userId);
      if (idx >= 0) s.members[idx] = a.payload;
      if (s.member?.userId === a.payload.userId) s.member = a.payload;
    });

    /* -------- delete -------- */
    b.addCase(deleteOrgMember.fulfilled, (s, a) => {
      s.members = s.members.filter((m) => m.userId !== a.payload);
      if (s.member?.userId === a.payload) s.member = null;
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
