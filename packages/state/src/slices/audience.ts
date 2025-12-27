import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../api';

export type AudienceType = 'ACADEMIC' | 'ACTIVITY';
export type AudienceLevel = 'PARENT' | 'LEVE';

export interface Audience {
  id: string;
  orgId: string;
  name: string;
  type: AudienceType;
  level: AudienceLevel;
  parentId: string | null;
  isExclusive: boolean;
  meta: any;
  createdAt: string;
  updatedAt: string;
}

export type Audiencestate = {
  list: Audience[];
  selected: Audience | null;
  status: 'idle' | 'loading' | 'failed';
  error?: string;
};

const initialState: Audiencestate = {
  list: [],
  selected: null,
  status: 'idle',
};

export const fetchAudiences = createAsyncThunk(
  'audience/fetchAll',
  async (orgId: string) => {
    const res = await api.get(`/api/orgs/${orgId}/audiences`);
    return res.data as Audience[];
  }
);

export const fetchAudience = createAsyncThunk(
  'audience/fetchOne',
  async ({ orgId, audienceId }: { orgId: string; audienceId: string }) => {
    const res = await api.get(`/api/orgs/${orgId}/audiences/${audienceId}`);
    return res.data as Audience;
  }
);

export const createAudience = createAsyncThunk(
  'audience/create',
  async ({ orgId, body }: { orgId: string; body: any }) => {
    const res = await api.post(`/api/orgs/${orgId}/audiences`, body);
    return res.data as Audience;
  }
);

export const updateAudience = createAsyncThunk(
  'audience/update',
  async ({
    orgId,
    audienceId,
    body,
  }: {
    orgId: string;
    audienceId: string;
    body: any;
  }) => {
    const res = await api.put(`/api/orgs/${orgId}/audiences/${audienceId}`, body);
    return res.data as Audience;
  }
);

export const deleteAudience = createAsyncThunk(
  'audience/delete',
  async ({ orgId, audienceId }: { orgId: string; audienceId: string }) => {
    await api.delete(`/api/orgs/${orgId}/audiences/${audienceId}`);
    return audienceId;
  }
);

const audienceSlice = createSlice({
  name: 'audience',
  initialState,
  reducers: {
    clearAudienceError(state) {
      state.error = undefined;
    },
    clearSelectedAudience(state) {
      state.selected = null;
    },
  },
  extraReducers: (b) => {
    //get audiences
    b.addCase(fetchAudiences.pending, (s) => {
      s.status = 'loading';
      s.error = undefined;
    });
    b.addCase(fetchAudiences.fulfilled, (s, a) => {
      s.status = 'idle';
      s.list = a.payload;
    });
    b.addCase(fetchAudiences.rejected, (s, a) => {
      s.status = 'failed';
      s.error = a.error.message;
    });

    //get audience
    b.addCase(fetchAudience.fulfilled, (s, a) => {
      s.selected = a.payload;
    });

    //create audience
    b.addCase(createAudience.fulfilled, (s, a) => {
      s.list.unshift(a.payload);
    });

    //update audience
    b.addCase(updateAudience.fulfilled, (s, a) => {
      const i = s.list.findIndex((x) => x.id === a.payload.id);
      if (i !== -1) s.list[i] = a.payload;
      if (s.selected?.id === a.payload.id) {
        s.selected = a.payload;
      }
    });

    //delete audience
    b.addCase(deleteAudience.fulfilled, (s, a) => {
      s.list = s.list.filter((x) => x.id !== a.payload);
      if (s.selected?.id === a.payload) {
        s.selected = null;
      }
    });
  },
});

export const { clearAudienceError, clearSelectedAudience } =
  audienceSlice.actions;

export default audienceSlice.reducer;
