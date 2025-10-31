// src/domain/invite.schema.ts
import { z } from 'zod';
import { ParentRole } from '../generated/prisma';

export const InviteBody = z
  .object({
    email: z.string().email(),
    role: z.nativeEnum(ParentRole).optional(),
    roleId: z.string().optional(),
    unitId: z.string().optional(),
    meta: z.any().optional(),
  })
  .refine((v) => v.role || v.roleId, {
    message: 'Provide either role or roleId',
  });

export const InviteListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().optional(),
  q: z.string().trim().min(1).max(200).optional(),
  role: z.nativeEnum(ParentRole).optional(),
  status: z.enum(['pending', 'accepted']).optional(),
  unitId: z.string().trim().min(1).optional(),
  sortKey: z
    .enum(['createdAt', 'email', 'expiresAt', 'role', 'unit', 'unitId'])
    .optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});

export const JoinCodeBody = z.object({ code: z.string().min(6) });

export const InviteSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(ParentRole),
  roleId: z.string().nullable().optional(),
  unitId: z.string().nullable().optional(),
  token: z.string(),
  joinCode: z.string(),
  expiresAt: z.string().datetime(),
  acceptedBy: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  meta: z.any().optional(),
});

export const InviteListResponse = z.object({
  items: z.array(InviteSchema),
  nextCursor: z.string().nullable(),
});

export const AcceptInviteResponse = z.object({
  message: z.string(),
  orgId: z.string(),
  unitId: z.string().nullable().optional(),
});

export const InvitePreviewSchema = z.object({
  orgId: z.string(),
  orgName: z.string(),
  unitName: z.string().nullable().optional(),
  invitedEmail: z.string().email(),
  parentRole: z.nativeEnum(ParentRole),
  roleName: z.string().nullable().optional(),
  expiresAt: z.string().datetime().optional(),
});

// Types
export type InviteBodyDTO = z.infer<typeof InviteBody>;
export type InviteListQueryDTO = z.infer<typeof InviteListQuery>;
export type JoinCodeDTO = z.infer<typeof JoinCodeBody>;
