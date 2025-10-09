import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../api';

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';
export interface Permission {
  id: string;
  code: string;
  name: string;
}

export interface RolePermissionLink {
  id: string;
  permission: Permission;
}

export interface Role {
  id: string;
  orgId: string;
  key: string;
  name: string;
  scope: string;
  parentRole?: 'admin' | 'staff' | 'student' | 'parent';
  createdAt?: string;
  permissions: RolePermissionLink[];
}

export interface RoleState {
  //catalog of all permissions
  permissions: {
    status: Status;
    items: Permission[];
    error?: string;
  };

  //roles per org
  rolesByOrg: Record<
    string,
    {
      status: Status;
      items: Role[];
      error?: string;
    }
  >;

  //single-op flags
  createStatus: Status;
  createError?: string;

  updateStatusById: Record<string, Status>; //roleId -> status
  updateErrorById: Record<string, string | undefined>;

  deleteStatusById: Record<string, Status>; //roleId -> status
  deleteErrorById: Record<string, string | undefined>;
}

const initialState: RoleState = {
  permissions: { status: 'idle', items: [] },
  rolesByOrg: {},
  createStatus: 'idle',
  updateStatusById: {},
  updateErrorById: {},
  deleteStatusById: {},
  deleteErrorById: {},
};

// get permissions catalog (global)
export const listPermissions = createAsyncThunk<
  Permission[],
  { orgId: string }
>('roles/listPermissions', async ({ orgId }) => {
  const { data } = await api.get(`/api/orgs/${orgId}/permissions`);
  return data as Permission[];
});

// get org by id roles
export const listRoles = createAsyncThunk<Role[], { orgId: string }>(
  'roles/list',
  async ({ orgId }) => {
    const { data } = await api.get(`/api/orgs/${orgId}/roles`);
    return data as Role[];
  }
);

// post role
export const createRole = createAsyncThunk<
  Role,
  {
    orgId: string;
    key: string;
    name: string;
    scope?: string;
    permissionCodes?: string[];
  }
>('roles/create', async ({ orgId, ...body }) => {
  const { data } = await api.post(`/api/orgs/${orgId}/roles`, body);
  return data as Role;
});

// patch by org id and role id
export const updateRole = createAsyncThunk<
  Role,
  {
    orgId: string;
    roleId: string;
    name?: string;
    scope?: string;
    permissionCodes?: string[];
  }
>('roles.update', async ({ orgId, roleId, ...body }) => {
  const { data } = await api.patch(`/api/orgs/${orgId}/roles/${roleId}`, body);
  return data as Role;
});

// delete role by org id and role id
export const deleteRole = createAsyncThunk<
  { orgId: string; roleId: string },
  { orgId: string; roleId: string }
>('roles/delete', async ({ orgId, roleId }) => {
  await api.delete(`/api/orgs/${orgId}/roles/${roleId}`);
  return { orgId, roleId };
});

//slices
const slice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    clearPermissions(state) {
      state.permissions = { status: 'idle', items: [] };
    },
    clearOrgRoles(state, action: PayloadAction<{ orgId: string }>) {
      delete state.rolesByOrg[action.payload.orgId];
    },
    resetCreateStatus(state) {
      state.createStatus = 'idle';
      state.createError = undefined;
    },
    resetUpdateStatus(state, action: PayloadAction<{ roleId: string }>) {
      const { roleId } = action.payload;
      state.updateStatusById[roleId] = 'idle';
      state.updateErrorById[roleId] = undefined;
    },
    resetDeleteStatus(state, action: PayloadAction<{ roleId: string }>) {
      const { roleId } = action.payload;
      state.deleteStatusById[roleId] = 'idle';
      state.deleteErrorById[roleId] = undefined;
    },
  },
  extraReducers: (b) => {
    //permissions
    b.addCase(listPermissions.pending, (s) => {
      s.permissions.status = 'loading';
      s.permissions.error = undefined;
    });
    b.addCase(listPermissions.fulfilled, (s, a) => {
      s.permissions.status = 'succeeded';
      s.permissions.items = a.payload;
    });
    b.addCase(listPermissions.rejected, (s, a) => {
      s.permissions.status = 'failed';
      s.permissions.error = a.error.message;
    });

    //list roles
    b.addCase(listRoles.pending, (s, a) => {
      const orgId = a.meta.arg.orgId;
      s.rolesByOrg[orgId] = s.rolesByOrg[orgId] || {
        status: 'idle',
        items: [],
      };
      s.rolesByOrg[orgId].status = 'loading';
      s.rolesByOrg[orgId].error = undefined;
    });
    b.addCase(listRoles.fulfilled, (s, a) => {
      const orgId = a.meta.arg.orgId;
      s.rolesByOrg[orgId] = { status: 'succeeded', items: a.payload };
    });
    b.addCase(listRoles.rejected, (s, a) => {
      const orgId = a.meta.arg.orgId;
      s.rolesByOrg[orgId] = s.rolesByOrg[orgId] || {
        status: 'failed',
        items: [],
      };
      s.rolesByOrg[orgId].status = 'failed';
      s.rolesByOrg[orgId].error = a.error.message;
    });

    //create roles
    b.addCase(createRole.pending, (s) => {
      s.createStatus = 'loading';
      s.createError = undefined;
    });
    b.addCase(createRole.fulfilled, (s, a) => {
      s.createStatus = 'succeeded';
      const role = a.payload;
      const entry = s.rolesByOrg[role.orgId] || { status: 'idle', items: [] };
      entry.items = [role, ...(entry.items || [])];
      s.rolesByOrg[role.orgId] = entry;
    });
    b.addCase(createRole.rejected, (s, a) => {
      s.createStatus = 'failed';
      s.createError = a.error.message;
    });

    //update role
    b.addCase(updateRole.pending, (s, a) => {
      const { roleId } = a.meta.arg;
      s.updateStatusById[roleId] = 'loading';
      s.updateErrorById[roleId] = undefined;
    });
    b.addCase(updateRole.fulfilled, (s, a) => {
      const updated = a.payload;
      s.updateStatusById[updated.id] = 'succeeded';
      const entry = s.rolesByOrg[updated.orgId];
      if (entry) {
        const i = entry.items.findIndex((r) => r.id === updated.id);
        if (i >= 0) entry.items[i] = updated;
      }
    });
    b.addCase(updateRole.rejected, (s, a) => {
      const { roleId } = a.meta.arg;
      s.deleteStatusById[roleId] = 'failed';
      s.deleteErrorById[roleId] = undefined;
    });

    //delete role
    b.addCase(deleteRole.pending, (s, a) => {
      const { roleId } = a.meta.arg;
      s.deleteStatusById[roleId] = 'loading';
      s.deleteErrorById[roleId] = undefined;
    });
    b.addCase(deleteRole.fulfilled, (s, a) => {
      const { orgId, roleId } = a.payload;
      s.deleteStatusById[roleId] = 'succeeded';
      const entry = s.rolesByOrg[orgId];
      if (entry) entry.items = entry.items.filter((r) => r.id !== roleId);
    });
    b.addCase(deleteRole.rejected, (s, a) => {
      const { roleId } = a.meta.arg;
      s.deleteStatusById[roleId] = 'failed';
      s.deleteErrorById[roleId] = a.error.message;
    });
  },
});

export const {
  clearPermissions,
  clearOrgRoles,
  resetCreateStatus,
  resetUpdateStatus,
  resetDeleteStatus,
} = slice.actions;
export default slice.reducer;
