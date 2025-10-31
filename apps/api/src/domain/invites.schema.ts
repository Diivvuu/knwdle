import { z } from 'zod';
import { ParentRole } from '../generated/prisma';

// ---------- Core items ----------
export const InviteItem = z.object({
  email: z.string().email(),
  role: z.nativeEnum(ParentRole).optional(),
  roleId: z.string().optional(),
  unitId: z.string().optional(),
  meta: z.any().optional(),
}).refine((v) => v.role || v.roleId, { message: 'Provide either role or roleId' });

export type InviteItemDTO = z.infer<typeof InviteItem>;

// Single invite create body
export const InviteCreateBody = InviteItem;

// List query (paginated + filters)
export const InviteListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().optional(),
  q: z.string().trim().min(1).max(200).optional(),
  role: z.nativeEnum(ParentRole).optional(),
  status: z.enum(['pending', 'accepted']).optional(),
  unitId: z.string().trim().min(1).optional(),
  sortKey: z.enum(['createdAt', 'email', 'expiresAt', 'role', 'unit', 'unitId']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});

export type InviteListQueryDTO = z.infer<typeof InviteListQuery>;

// Join code accept body
export const JoinCodeBody = z.object({ code: z.string().min(6) });
export type JoinCodeDTO = z.infer<typeof JoinCodeBody>;

// API response shapes
export const InviteSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(ParentRole),
  roleId: z.string().nullable().optional(),
  unitId: z.string().nullable().optional(),
  token: z.string(),
  joinCode: z.string().nullable().optional(),
  expiresAt: z.string().datetime(),
  acceptedBy: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  meta: z.any().optional(),
});

export const InviteListResponse = z.object({
  items: z.array(InviteSchema),
  nextCursor: z.string().nullable(),
});

// ---------- Bulk ----------
export const BulkInviteOptions = z.object({
  expiresInDays: z.number().int().min(1).max(30).default(7),
  sendEmail: z.boolean().default(true),
  dryRun: z.boolean().default(false),
});

export const BulkInviteBody = z.object({
  invites: z.array(InviteItem).min(1).max(200),
  options: BulkInviteOptions.default({}),
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

// Path params
