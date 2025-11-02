// packages/state/src/slices/orgUnitTypes.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../api';
import { FeatureFlags, OrgUnitType } from './org.unit';

/* --------------------------------- Types ---------------------------------- */

// Keep this in sync with backend enum

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

type OrgUnitTypesListPayload = {
  orgType: string;
  types: OrgUnitType[];
  featureDefaults: Partial<Record<OrgUnitType, FeatureFlags>>;
};

type OrgUnitTypeSchemaPayload = {
  orgType: string;
  unitType: OrgUnitType;
  uiVersion: number;
  definition: {
    type: 'object';
    title: string;
    properties: Record<
      string,
      {
        type: string;
        title?: string;
        description?: string;
        format?: string;
        enum?: string[];
        ['x-ui']?: Record<string, any>;
      }
    >;
  };
  groups?: Array<{ name: string; fields: string[] }>;
};

type OrgUnitTypeFeaturesPayload = {
  orgType: string;
  unitType: OrgUnitType;
  features: FeatureFlags;
};

type AllowedChildTypesPayload = {
  orgType: string;
  parentType: OrgUnitType | null;
  allowed: OrgUnitType[];
};

interface OrgUnitTypesState {
  // list of available unit types for the current org
  types: OrgUnitType[];
  typesStatus: Status;
  typesError?: string | null;

  // defaults coming from rulebook
  featuresByType: Partial<Record<OrgUnitType, FeatureFlags>>;

  // UI schemas keyed by unit type
  schemaByType: Partial<
    Record<
      OrgUnitType,
      {
        definition: OrgUnitTypeSchemaPayload['definition'];
        groups?: Array<{ name: string; fields: string[] }>;
      }
    >
  >;
  schemaStatus: Status;
  schemaError?: string | null;

  // single fetch for features endpoint (optional but handy)
  featureStatus: Status;
  featureError?: string | null;

  allowedByParent: Record<string, OrgUnitType[]>;
  allowedStatus: Status;
  allowedError?: string | null;
}

/* --------------------------------- Thunks --------------------------------- */

// GET /api/orgs/:orgId/org-unit-types
export const fetchOrgUnitTypes = createAsyncThunk(
  'orgUnitTypes/fetchList',
  async (orgId: string) => {
    const { data } = await api.get<OrgUnitTypesListPayload>(
      `/api/orgs/${orgId}/org-unit-types`
    );
    return data;
  }
);

// GET /api/orgs/:orgId/org-unit-types/:type/schema
export const fetchOrgUnitSchema = createAsyncThunk(
  'orgUnitTypes/fetchSchema',
  async (p: { orgId: string; unitType: OrgUnitType }) => {
    const { data } = await api.get<OrgUnitTypeSchemaPayload>(
      `/api/orgs/${p.orgId}/org-unit-types/${p.unitType}/schema`
    );
    return data;
  }
);

// GET /api/orgs/:orgId/org-unit-types/:type/features
export const fetchOrgUnitFeatures = createAsyncThunk(
  'orgUnitTypes/fetchFeatures',
  async (p: { orgId: string; unitType: OrgUnitType }) => {
    const { data } = await api.get<OrgUnitTypeFeaturesPayload>(
      `/api/orgs/${p.orgId}/org-unit-types/${p.unitType}/features`
    );
    return data;
  }
);

export const fetchAllowedChildTypes = createAsyncThunk(
  'orgUnitTypes/fetchAllowed',
  async (p: { orgId: string; parentType?: OrgUnitType | null }) => {
    const q = p.parentType
      ? `?parentType=${encodeURIComponent(p.parentType)}`
      : '';
    const { data } = await api.get<AllowedChildTypesPayload>(
      `/api/orgs/${p.orgId}/org-unit-types/allowed${q}`
    );
    return data;
  }
);

/* --------------------------------- Slice ---------------------------------- */

const initialState: OrgUnitTypesState = {
  types: [],
  typesStatus: 'idle',
  typesError: null,

  featuresByType: {},

  schemaByType: {},
  schemaStatus: 'idle',
  schemaError: null,

  featureStatus: 'idle',
  featureError: null,

  allowedByParent: {},
  allowedStatus: 'idle',
  allowedError: null,
};

const orgUnitTypesSlice = createSlice({
  name: 'orgUnitTypes',
  initialState,
  reducers: {
    resetOrgUnitTypesState(state) {
      state.typesStatus = 'idle';
      state.typesError = null;
      state.schemaStatus = 'idle';
      state.schemaError = null;
      state.featureStatus = 'idle';
      state.featureError = null;
      state.allowedByParent = {};
      state.allowedStatus = 'idle';
      state.allowedError = null;
    },
  },
  extraReducers: (b) => {
    // List
    b.addCase(fetchOrgUnitTypes.pending, (s) => {
      s.typesStatus = 'loading';
      s.typesError = null;
    });
    b.addCase(fetchOrgUnitTypes.fulfilled, (s, a) => {
      s.typesStatus = 'succeeded';
      s.types = a.payload.types ?? [];
      s.featuresByType = a.payload.featureDefaults ?? {};
    });
    b.addCase(fetchOrgUnitTypes.rejected, (s, a) => {
      s.typesStatus = 'failed';
      s.typesError = a.error.message ?? 'Failed to load org unit types';
    });

    // Schema
    b.addCase(fetchOrgUnitSchema.pending, (s) => {
      s.schemaStatus = 'loading';
      s.schemaError = null;
    });
    b.addCase(fetchOrgUnitSchema.fulfilled, (s, a) => {
      s.schemaStatus = 'succeeded';
      const unitType = a.payload.unitType;
      s.schemaByType[unitType] = {
        definition: a.payload.definition,
        groups: a.payload.groups ?? [],
      };
    });
    b.addCase(fetchOrgUnitSchema.rejected, (s, a) => {
      s.schemaStatus = 'failed';
      s.schemaError = a.error.message ?? 'Failed to load org unit schema';
    });

    // Features (single-type fetch)
    b.addCase(fetchOrgUnitFeatures.pending, (s) => {
      s.featureStatus = 'loading';
      s.featureError = null;
    });
    b.addCase(fetchOrgUnitFeatures.fulfilled, (s, a) => {
      s.featureStatus = 'succeeded';
      const { unitType, features } = a.payload;
      s.featuresByType[unitType] = features;
    });
    b.addCase(fetchOrgUnitFeatures.rejected, (s, a) => {
      s.featureStatus = 'failed';
      s.featureError = a.error.message ?? 'Failed to load org unit features';
    });

    // allowed child types
    b.addCase(fetchAllowedChildTypes.pending, (s, a) => {
      s.allowedStatus = 'loading';
      s.allowedError = null;
    });
    b.addCase(fetchAllowedChildTypes.fulfilled, (s, a) => {
      s.allowedStatus = 'succeeded';
      const key = a.payload.parentType ?? 'ROOT';
      s.allowedByParent[key] = a.payload.allowed ?? [];
    });
    b.addCase(fetchAllowedChildTypes.rejected, (s, a) => {
      s.allowedStatus = 'failed';
      s.allowedError =
        a.error.message ?? 'Failed to load allowed child unit types';
    });
  },
});

export const { resetOrgUnitTypesState } = orgUnitTypesSlice.actions;
export default orgUnitTypesSlice.reducer;

/* ------------------------------- Selectors -------------------------------- */

export const selectOrgUnitTypes = (s: any): OrgUnitType[] =>
  s.orgUnitTypes?.types ?? [];

export const selectOrgUnitTypesStatus = (s: any): Status =>
  s.orgUnitTypes?.typesStatus ?? 'idle';

export const selectOrgUnitTypeSchema = (type: OrgUnitType) => (s: any) =>
  s.orgUnitTypes?.schemaByType?.[type]?.definition;

export const selectOrgUnitSchemaStatus = (s: any): Status =>
  s.orgUnitTypes?.schemaStatus ?? 'idle';

export const selectOrgUnitTypeFeatures = (type: OrgUnitType) => (s: any) =>
  s.orgUnitTypes?.featuresByType?.[type] ?? {};

export const selectAllowedChildTypes =
  (parentType?: OrgUnitType | null) =>
  (s: any): OrgUnitType[] => {
    const key = parentType ?? 'ROOT';
    return s.orgUnitTypes.allowedByParent?.[key] ?? [];
  };

export const selectAllowedStatus = (s: any): Status =>
  s.orgUnitTypes?.allowedStatus ?? 'idle';
