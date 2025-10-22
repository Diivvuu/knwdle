// src/domain/bulk-invite.schema.ts
import { z } from 'zod';
import { ParentRole } from '../generated/prisma';

export const BulkInviteItem = z.object({
  email: z.string().email(),
  role: z.nativeEnum(ParentRole).optional(),
  roleId: z.string().optional(),
  unitId: z.string().optional(),
  meta: z.any().optional(),
}).refine(v => v.role || v.roleId, { message: 'Provide either role or roleId' });

export const BulkInviteBody = z.object({
  invites: z.array(BulkInviteItem).min(1).max(200),
  options: z.object({
    expiresInDays: z.number().int().min(1).max(30).default(7),
    sendEmail: z.boolean().default(true),
    dryRun: z.boolean().default(false),
  }).default({}),
});

export const BulkInviteStatus = z.enum(['queued', 'running', 'done', 'error']);

export const BulkInviteDryRunResponse = z.object({
  batchId: z.string(),
  total: z.number().int(),
  status: z.literal('done'),
  sent: z.number().int(),
  failed: z.number().int(),
  skipped: z.number().int(),
});

export const BulkInviteKickoffResponse = z.object({
  batchId: z.string(),
  total: z.number().int(),
  status: z.union([z.literal('running'), z.literal('done')]),
});

export const BulkInviteStatusResponse = z.object({
  status: BulkInviteStatus,
  total: z.number().int(),
  sent: z.number().int().nullable().optional(),
  failed: z.number().int().nullable().optional(),
  skipped: z.number().int().nullable().optional(),
});

export const OrgIdParam = z.object({ id: z.string() });
export const OrgBatchParams = z.object({ id: z.string(), batchId: z.string() });