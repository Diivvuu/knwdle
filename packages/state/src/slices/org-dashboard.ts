// src/redux/slices/orgs.ts
import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { api, setAuthToken } from '../api';

// ---------------- Types ----------------
export interface OrgProfile {
  id: string;
  orgId: string;
  meta: Record<string, any>;
}

export interface OrgMember {
  id: string;
  userId: string;
  role: string;
  unitId?: string | null;
}

export interface Org {
  id: string;
  name: string;
  type: string; // runtime-driven, you already fetch /org-types
  description?: string | null;
  teamSize?: string | null;
  country?: string | null;
  timezone?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  brand_color?: string | null;
  address?: string | null;
  contactPhone?: string | null;
  createdAt: string;
  profile?: OrgProfile | null;
  members?: OrgMember[]; // present on GET /orgs/:id
}

type UpdateOrgBody = Partial<{
  name: string;
  description: string | null;
  teamSize: string | null;
  country: string | null;
  timezone: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  brand_color: string | null;
  address: string | null;
  contactPhone: string | null;
  meta: Record<string, any>;
}>;

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface OrgState {
  items: Org[];
  listStatus: Status;
  byIdStatus: Record<string, Status>;
  error?: string;
  currentOrgId?: string;
}

const initialState: OrgState = {
  items: [],
  listStatus: 'idle',
  byIdStatus: {},
};

export const fetchOrgs = createAsyncThunk<Org[]>('orgs/fetchAll', async () => {
  const res = await api.get('/dashboard/orgs');
  return res.data as Org[];
});

export const fetchOrgById = createAsyncThunk<Org, string>(
  'orgs/fetchById',
  async (id: string) => {
    const res = await api.get(`/dashboard/orgs/${id}`);
    return res.data as Org;
  }
);

export const createOrg = createAsyncThunk<
  Org,
  { name: string; teamSize: string; type: string; meta?: Record<string, any> }
>('orgs/create', async (payload) => {
  const res = await api.post('/dashboard/orgs', payload);
  return res.data as Org;
});

export const updateOrg = createAsyncThunk<Org, { id: string } & UpdateOrgBody>(
  'orgs/update',
  async ({ id, ...body }) => {
    const res = await api.patch(`/dashboard/orgs/${id}`, body);
    return res.data as Org;
  }
);

export const deleteOrg = createAsyncThunk<string, string>(
  'orgs/delete',
  async (id: string) => {
    await api.delete(`/dashboard/orgs/${id}`);
    return id;
  }
);

const orgSlice = createSlice({
  name: 'orgs',
  initialState,
  reducers: {
    setCurrentOrgId(state, action: PayloadAction<string | undefined>) {
      state.currentOrgId = action.payload;
    },
    clearOrgs(state) {
      state.items = [];
      state.listStatus = 'idle';
      state.byIdStatus = {};
      state.error = undefined;
      state.currentOrgId = undefined;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchOrgs.pending, (s) => {
      s.listStatus = 'loading';
    });
    b.addCase(fetchOrgs.fulfilled, (s, a) => {
      s.listStatus = 'succeeded';
      s.items = a.payload;
    });
    b.addCase(fetchOrgs.rejected, (s, a) => {
      s.listStatus = 'failed';
      s.error = a.error.message;
    });
    b.addCase(fetchOrgById.pending, (s, a) => {
      s.byIdStatus[a.meta.arg] = 'loading';
    });
    b.addCase(fetchOrgById.fulfilled, (s, a) => {
      s.byIdStatus[a.payload.id] = 'succeeded';
      const idx = s.items.findIndex((o) => o.id === a.payload.id);
      if (idx >= 0) s.items[idx] = a.payload;
      else s.items.push(a.payload);
    });
    b.addCase(fetchOrgById.rejected, (s, a) => {
      s.byIdStatus[a.meta.arg] = 'failed';
      s.error = a.error.message;
    });
    b.addCase(createOrg.fulfilled, (s, a) => {
      s.items.unshift(a.payload);
    });
    b.addCase(updateOrg.fulfilled, (s, a) => {
      const idx = s.items.findIndex((o) => o.id === a.payload.id);
      if (idx >= 0) s.items[idx] = a.payload;
    });
    b.addCase(deleteOrg.fulfilled, (s, a) => {
      s.items = s.items.filter((o) => o.id !== a.payload);
      if (s.currentOrgId === a.payload) s.currentOrgId = undefined;
    });
  },
});

export const { setCurrentOrgId, clearOrgs } = orgSlice.actions;
export default orgSlice.reducer;
