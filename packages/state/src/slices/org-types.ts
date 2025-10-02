import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, setAuthToken } from '../api';

export type JsonSchema = Record<string, any>;

type OrgTypesState = {
  types: string[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string;
  schemas: Record<string, JsonSchema | undefined>;
  schemaStatus: Record<string, 'idle' | 'loading' | 'succeeded' | 'failed'>;
};

const initialState: OrgTypesState = {
  types: [],
  status: 'idle',
  schemas: {},
  schemaStatus: {},
};

export const fetchOrgTypes = createAsyncThunk<string[]>(
  'orgTypes/fetchAll',
  async () => {
    const res = await api.get('/api/org-types');
    return (res.data?.types ?? []) as string[];
  }
);

export const fetchOrgTypeSchema = createAsyncThunk<
  { type: string; schema: JsonSchema },
  string
>('orgTypes/fetchSchema', async (type: string) => {
  const res = await api.get(`/api/org-types/${type}`);
  return {
    type: res.data?.type as string,
    schema: res.data?.schema as JsonSchema,
  };
});

const orgTypesSlice = createSlice({
  name: 'orgTypes',
  initialState,
  reducers: {},
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
      s.error = a.error.message;
    });

    b.addCase(fetchOrgTypeSchema.pending, (s, a) => {
      const t = a.meta.arg;
      s.schemaStatus[t] = 'loading';
    });
    b.addCase(fetchOrgTypeSchema.fulfilled, (s, a) => {
      const { type, schema } = a.payload;
      s.schemaStatus[type] = 'succeeded';
      s.schemas[type] = schema;
    });
    b.addCase(fetchOrgTypeSchema.rejected, (s, a) => {
      const t = a.meta.arg;
      s.schemaStatus[t] = 'failed';
    });
  },
});

export default orgTypesSlice.reducer;
