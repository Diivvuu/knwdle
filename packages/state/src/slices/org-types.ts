// packages/state/src/slices/orgType.ts
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../api';
import { create } from 'domain';

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
  definition: any; // JSON Schema object definition (with properties/required and x-ui)
  groups: OrgTypeSchemaGroups;
};

type Loading = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface OrgTypeState {
  // list of types
  types: OrgTypeId[];
  status: Loading;
  error?: string;

  // per-type schema cache
  schemas: Record<OrgTypeId, OrgTypeSchemaPayload | undefined>;
  schemaStatus: Record<OrgTypeId, Loading>;
  schemaError: Record<OrgTypeId, string | undefined>;

  structures: Record<
    OrgTypeId,
    { orgType: OrgTypeId; hierarchy: Record<string, string[]> } | undefined
  >;
  structureStatus: Record<OrgTypeId, Loading>;
  structureError: Record<OrgTypeId, string | undefined>;
}

const initialState: OrgTypeState = {
  types: [],
  status: 'idle',
  schemas: {},
  schemaStatus: {},
  schemaError: {},
  structures: {},
  structureStatus: {},
  structureError: {},
};

/**
 * GET /org-types
 * -> { types: string[] }
 */
export const fetchOrgTypes = createAsyncThunk<OrgTypeId[]>(
  'orgType/fetchTypes',
  async () => {
    const { data } = await api.get('/api/org-types');
    // backend returns { types: [...] }
    return Array.isArray(data?.types)
      ? (data.types as OrgTypeId[])
      : (data as OrgTypeId[]);
  }
);

/**
 * GET /org-types/:type/schema
 * -> { type, uiVersion, definition, groups }
 * Normalizes a couple of shapes just in case.
 */
export const fetchOrgTypeSchema = createAsyncThunk<
  OrgTypeSchemaPayload,
  { type: OrgTypeId }
>('orgType/fetchSchema', async ({ type }, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/api/org-types/${String(type)}/schema`);

    // Normalize shape defensively
    const payload: OrgTypeSchemaPayload = {
      type: (data?.type ?? type) as OrgTypeId,
      uiVersion: Number(data?.uiVersion ?? 1),
      definition: data?.definition ?? data?.schema ?? data,
      groups: Array.isArray(data?.groups) ? data.groups : [],
    };

    // Ensure required structure exists
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

export const fetchOrgTypeStructure = createAsyncThunk<
  { type: OrgTypeId; orgType: OrgTypeId; hierarchy: Record<string, string[]> },
  { type: OrgTypeId }
>('orgType/fetchStructure', async ({ type }, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/api/org-types/${String(type)}/structure`);

    const payload = {
      type: (data?.type ?? type) as OrgTypeId,
      orgType: (data?.orgType ?? type) as OrgTypeId,
      hierarchy: data?.hierarchy ?? {},
    };

    return payload;
  } catch (error: any) {
    const msg = error?.response?.data?.error || error?.message;
    return rejectWithValue(msg) as any;
  }
});

const orgTypeSlice = createSlice({
  name: 'orgType',
  initialState,
  reducers: {
    // Optional manual resetters
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
    // list
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

    // schema (per type)
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

    // structure
    b.addCase(fetchOrgTypeStructure.pending, (s, a) => {
      const t = a.meta.arg.type;
      s.structureStatus[t] = 'loading';
      s.structureError[t] = undefined;
    });
    b.addCase(fetchOrgTypeStructure.fulfilled, (s, a) => {
      const { type } = a.payload;
      s.structureStatus[type] = 'succeeded';
      s.structures[type] = {
        orgType: a.payload.orgType,
        hierarchy: a.payload.hierarchy,
      };
    });
    b.addCase(fetchOrgTypeStructure.rejected, (s, a) => {
      const t = (a.meta.arg as { type: OrgTypeId }).type;
      s.structureStatus[t] = 'failed';
      s.structureError[t] = (a.payload as string) || a.error.message;
    });
  },
});

export const { resetOrgTypes, resetOrgTypeSchema } = orgTypeSlice.actions;
export default orgTypeSlice.reducer;

/* ------------ selectors (optional, handy) ------------ */
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

export const selectOrgTypesStructure = (type: OrgTypeId) => (state: any) => {
  state.orgType.structures?.[type];
};
