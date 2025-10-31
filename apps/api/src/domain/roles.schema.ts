import z from 'zod';
import { OrgIdParam } from './org.unit-types.schema';

export const scopeEnum = z.enum(['org', 'unit']);

export const RoleIdParam = z.object({
  id: z.string(),
  roleId: z.string(),
});

export const RoleCreateBody = z.object({
  key: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(80),
  scope: scopeEnum.default('org'),
  permissionCodes: z.array(z.string()).default([]),
});

export const RoleUpdateBody = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  scope: scopeEnum.optional(),
  permissionCodes: z.array(z.string()).optional(),
});

export const AssignRoleBody = z.object({
  userId: z.string(),
  roleId: z.string().nullable(),
});

export const BasicError = z.object({
  error: z.string(),
  details: z.any().optional(),
});

// types
export type OrgIdParamDTO = z.infer<typeof OrgIdParam>;
export type RoleIdParamDTO = z.infer<typeof RoleIdParam>;
export type RoleCreateDTO = z.infer<typeof RoleCreateBody>;
export type RoleUpdateDTO = z.infer<typeof RoleUpdateBody>;
export type AssignRoleDTO = z.infer<typeof AssignRoleBody>;
