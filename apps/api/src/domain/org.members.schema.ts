import z, { optional } from 'zod';
import { ParentRole } from '../generated/prisma';

export const ListMembersQuery = z.object({
  role: z.string().optional(),
  roleId: z.string().optional(),
  unitId: z.string().optional(),
  search: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.string().optional(),
});

export const CreateMemberBody = z.object({
  userId: z.string(),
  role: z.enum(['admin', 'staff', 'student', 'parent']),
  roleId: z.string().optional(),
  unitId: z.string().optional(),
});

export const UpdateMemberBody = z.object({
  role: z.enum(['admin', 'staff', 'student', 'parent']).optional(),
  roleId: z.string().optional(),
  unitId: z.string().nullable().optional(),
});

export const OrgMemberIdParams = z.object({
  orgId: z.string().cuid(),
  memberId: z.string().cuid(),
});

export const OrgMemberListQuery = z.object({
  role: z.nativeEnum(ParentRole).optional(),
  roleId: z.string().optional(),
  unitId: z.string().optional(),
  search: z.string().trim().optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const OrgMemberResponse = z.object({
  id: z.string(),
  orgId: z.string(),
  userId: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: z.nativeEnum(ParentRole),
  roleId: z.string().nullable(),
  unitId: z.string().nullable(),
  createdAt: z.string(),
});

export const OrgMemberListResponse = z.object({
  items: z.array(OrgMemberResponse),
  nextCursor: z.string().nullable(),
});
