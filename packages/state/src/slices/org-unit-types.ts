import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../api';

export interface OrgUnitMetaSchema {
  type: string;
  schema: any;
}

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

interface OrgUnitTypesState {
  types: string[];
  typesStatus: Status;
  typesError?: string | null;

  schemaByType: Record<string, OrgUnitMetaSchema>;
  schemaStatus: Status;
  schemaError?: string | null;
}

const initialState: OrgUnitTypesState = {
  types: [],
  typesStatus: 'idle',
  typesError: null,
  schemaByType: {},
  schemaStatus: 'idle',
  schemaError: null,
};

export const fetchOrgUnitTypes = createAsyncThunk(
  'orgUnitTypes/fetchAll',
  async () => {
    const { data } = await api.get<{ types: string[] }>('/api/org-unit-types');
    return data.types;
  }
);

export const fetchOrgUnitSchema = createAsyncThunk(
  'orgUnitTypes/fetchSchema',
  async (unitType: string) => {
    const { data } = await api.get<OrgUnitMetaSchema>(
      `/api/org-unit-types/${unitType}`
    );
    return data;
  }
);

const slice = createSlice({
  name: 'orgUnitTypes',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchOrgUnitTypes.pending, (s) => {
      s.typesStatus = 'loading';
      s.typesError = null;
    });
    b.addCase(fetchOrgUnitTypes.fulfilled, (s, a) => {
      s.typesStatus = 'succeeded';
      s.types = a.payload;
    });
    b.addCase(fetchOrgUnitTypes.rejected, (s, a) => {
      s.typesStatus = 'failed';
      s.typesError = a.error.message;
    });

    b.addCase(fetchOrgUnitSchema.pending, (s) => {
      s.schemaStatus = 'loading';
      s.schemaError = null;
    });
    b.addCase(fetchOrgUnitSchema.fulfilled, (s, a) => {
      s.schemaStatus = 'succeeded';
      const payload = a.payload;
      s.schemaByType[payload.type] = payload;
    });
    b.addCase(fetchOrgUnitSchema.rejected, (s, a) => {
      s.schemaStatus = 'failed';
      s.schemaError = a.error.message;
    });
  },
});

export default slice.reducer;
