import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../api';

export type OrgTypeId =
  | 'SCHOOL'
  | 'COACHING_CENTER'
  | 'TUITION_CENTER'
  | 'COLLEGE'
  | 'UNIVERSITY'
  | 'EDTECH'
  | 'TRAINING'
  | 'NGO'
  | string;

export type OrgTypeSchemaGroups = Array<{ name: string; fields: string[] }>;

export type OrgTypeSchemaPayload = {
  type: OrgTypeId;
  uiVersion: number;
  definition: any;
  groups: OrgTypeSchemaGroups;
};

type Loading = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface OrgTypeState {
  types: OrgTypeId[];
  status: Loading;
  error?: string;

  schemas: Record<OrgTypeId, OrgTypeSchemaPayload | undefined>;
  schemaStatus: Record<OrgTypeId, Loading>;
  schemaError: Record<OrgTypeId, string | undefined>;
}

const initialState: OrgTypeState = {
  types: [],
  status: 'idle',
  schemas: {},
  schemaStatus: {},
  schemaError: {},
};

export const fetchOrgTypes = createAsyncThunk<OrgTypeId[]>(
  'orgType/fetchTypes',
  async () => {
    const { data } = await api.get('/api/org-types');
    return Array.isArray(data?.types)
      ? (data.types as OrgTypeId[])
      : (data as OrgTypeId[]);
  }
);

export const fetchOrgTypeSchema = createAsyncThunk<
  OrgTypeSchemaPayload,
  { type: OrgTypeId }
>('orgType/fetchSchema', async ({ type }, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/api/org-types/${String(type)}/schema`);
    const payload: OrgTypeSchemaPayload = {
      type: (data?.type ?? type) as OrgTypeId,
      uiVersion: Number(data?.uiVersion ?? 1),
      definition: data?.definition ?? data?.schema ?? data,
      groups: Array.isArray(data?.groups) ? data.groups : [],
    };
    if (!payload?.definition?.properties) {
      throw new Error('Schema transform failed: missing properties');
    }
    return payload;
  } catch (err: any) {
    const msg =
      err?.response?.data?.error ||
      err?.message ||
      'Failed to load org type schema';
    return rejectWithValue(msg) as any;
  }
});

const orgTypeSlice = createSlice({
  name: 'orgType',
  initialState,
  reducers: {
    resetOrgTypes(state) {
      state.types = [];
      state.status = 'idle';
      state.error = undefined;
    },
    resetOrgTypeSchema(state, action: PayloadAction<{ type: OrgTypeId }>) {
      const t = action.payload.type;
      delete state.schemas[t];
      state.schemaStatus[t] = 'idle';
      state.schemaError[t] = undefined;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchOrgTypes.pending, (s) => {
      s.status = 'loading';
      s.error = undefined;
    });
    b.addCase(fetchOrgTypes.fulfilled, (s, a) => {
      s.status = 'succeeded';
      s.types = a.payload;
    });
    b.addCase(fetchOrgTypes.rejected, (s, a) => {
      s.status = 'failed';
      s.error = (a.payload as string) || a.error.message;
    });

    b.addCase(fetchOrgTypeSchema.pending, (s, a) => {
      const t = a.meta.arg.type;
      s.schemaStatus[t] = 'loading';
      s.schemaError[t] = undefined;
    });
    b.addCase(fetchOrgTypeSchema.fulfilled, (s, a) => {
      const { type } = a.payload;
      s.schemaStatus[type] = 'succeeded';
      s.schemas[type] = a.payload;
    });
    b.addCase(fetchOrgTypeSchema.rejected, (s, a) => {
      const t = (a.meta.arg as { type: OrgTypeId }).type;
      s.schemaStatus[t] = 'failed';
      s.schemaError[t] = (a.payload as string) || a.error.message;
    });
  },
});

export const { resetOrgTypes, resetOrgTypeSchema } = orgTypeSlice.actions;
export default orgTypeSlice.reducer;

export const selectOrgTypes = (state: any) =>
  state.orgType.types as OrgTypeId[];
export const selectOrgTypesStatus = (state: any) =>
  (state.orgType.status as Loading) || 'idle';
export const selectOrgTypeSchema = (type: OrgTypeId) => (state: any) =>
  state.orgType.schemas?.[type] as OrgTypeSchemaPayload | undefined;
export const selectOrgTypeSchemaStatus = (type: OrgTypeId) => (state: any) =>
  (state.orgType.schemaStatus?.[type] as Loading) || 'idle';
export const selectOrgTypeSchemaError = (type: OrgTypeId) => (state: any) =>
  state.orgType.schemaError?.[type];
