import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../api';

export interface AudienceMember {
  id: string;
  userId: string;
  user: { name?: string; email?: string };
  role: 'admin' | 'staff' | 'student' | 'parent';
  roleId?: string | null;
  audienceId: string;
  audienceName?: string;
  createdAt: string;
}

export interface AvailableAudienceMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'student' | 'parent';
  roleId?: string | null;
  createdAt: string;
}

export type AudienceMemberState = {
  list: AudienceMember[];
  available: AvailableAudienceMember[];
  status: 'idle' | 'loading' | 'failed';
  availableStatus: 'idle' | 'loading' | 'failed';
  error?: string;
};

const initialState: AudienceMemberState = {
  list: [],
  available: [],
  status: 'idle',
  availableStatus: 'idle',
};

export const fetchAudienceMembers = createAsyncThunk(
  'audienceMembers/fetch',
  async ({
    orgId,
    audienceId,
    search,
    limit,
  }: {
    orgId: string;
    audienceId: string;
    search?: string;
    limit?: number;
  }) => {
    const res = await api.get(
      `/api/orgs/${orgId}/audiences/${audienceId}/members`,
      {
        params: {
          ...(search ? { search } : {}),
          ...(limit ? { limit } : {}),
        },
      }
    );
    return res.data as AudienceMember[];
  }
);

export const fetchAvailableAudienceMembers = createAsyncThunk(
  'audienceMembers/fetchAvailable',
  async ({
    orgId,
    audienceId,
    limit,
  }: {
    orgId: string;
    audienceId: string;
    limit?: number;
  }) => {
    const res = await api.get(
      `/api/orgs/${orgId}/audiences/${audienceId}/available-members`,
      {
        params: {
          ...(limit ? { limit } : {}),
        },
      }
    );

    const members = (res.data ?? []).map((m: any) => ({
      id: m.id,
      userId: m.userId,
      email: m.user?.email ?? '',
      name: m.user?.name ?? '',
      role: m.role,
      roleId: m.roleId ?? null,
      createdAt: m.createdAt,
    })) as AvailableAudienceMember[];

    return members;
  }
);

export const addAudienceMember = createAsyncThunk(
  'audienceMembers/add',
  async ({
    orgId,
    audienceId,
    body,
  }: {
    orgId: string;
    audienceId: string;
    body: {
      userId: string;
      role: 'admin' | 'staff' | 'student' | 'parent';
      //   roleId?: string | null;
    };
  }) => {
    const res = await api.post(
      `/api/orgs/${orgId}/audiences/${audienceId}/members`,
      body
    );
    return res.data as AudienceMember;
  }
);

export const removeAudienceMember = createAsyncThunk(
  'audienceMembers/remove',
  async ({
    orgId,
    audienceId,
    userId,
  }: {
    orgId: string;
    audienceId: string;
    userId: string;
  }) => {
    await api.delete(`/api/orgs/${orgId}/audiences/${audienceId}/members/${userId}`);
    return userId;
  }
);

//move student between audience
export const moveStudentAudience = createAsyncThunk(
  'audienceMembers/moveStudent',
  async ({
    orgId,
    studentId,
    fromAudienceId,
    toAudienceId,
  }: {
    orgId: string;
    studentId: string;
    fromAudienceId: string;
    toAudienceId: string;
  }) => {
    const res = await api.post(`/api/${orgId}/audiences/move-student`, {
      studentId,
      fromAudienceId,
      toAudienceId,
    });
    return res.data;
  }
);

const audienceMembersSlice = createSlice({
  name: 'audienceMembers',
  initialState,
  reducers: {
    clearAudienceMembers(state) {
      state.list = [];
      state.status = 'idle';
      state.available = [];
      state.availableStatus = 'idle';
      state.error = undefined;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchAudienceMembers.pending, (s) => {
      s.status = 'loading';
      s.error = undefined;
    });
    b.addCase(fetchAudienceMembers.fulfilled, (s, a) => {
      s.status = 'idle';
      s.list = a.payload;
    });
    b.addCase(fetchAudienceMembers.rejected, (s, a) => {
      s.status = 'failed';
      s.error = a.error.message;
    });

    b.addCase(fetchAvailableAudienceMembers.pending, (s) => {
      s.availableStatus = 'loading';
      s.error = undefined;
    });
    b.addCase(fetchAvailableAudienceMembers.fulfilled, (s, a) => {
      s.availableStatus = 'idle';
      s.available = a.payload;
    });
    b.addCase(fetchAvailableAudienceMembers.rejected, (s, a) => {
      s.availableStatus = 'failed';
      s.error = a.error.message;
    });

    b.addCase(addAudienceMember.fulfilled, (s, a) => {
      s.list.push(a.payload);
    });

    b.addCase(removeAudienceMember.fulfilled, (s, a) => {
      s.list = s.list.filter((m: AudienceMember) => m.userId !== a.payload);
    });
  },
});

export const { clearAudienceMembers } = audienceMembersSlice.actions;
export default audienceMembersSlice.reducer;
