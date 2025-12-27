import z from 'zod';
import { AudienceType } from '../generated/prisma';
import { AudienceLevel } from '../generated/prisma';

export const CreateAudienceSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.nativeEnum(AudienceType),
  parentId: z.string().cuid().optional().nullable(),
  isExclusive: z.boolean().optional(),
  meta: z.record(z.any()).optional(),
});

export const UpdateAudienceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isExclusive: z.boolean().optional(),
  meta: z.record(z.any()).optional(),
});

export const ListAudienceQuerySchema = z.object({
  type: z.nativeEnum(AudienceType).optional(),
  parentId: z.string().cuid().optional().nullable(),
  tree: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .default('false'),
});

export const AudienceResponseSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  name: z.string(),
  type: z.nativeEnum(AudienceType),
  level: z.nativeEnum(AudienceLevel),
  parentId: z.string().nullable(),
  isExclusive: z.boolean(),
  meta: z.any(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AudienceTreeNodeSchema: z.ZodType<any> = z.object({
  id: z.string(),
  name: z.string(),
  type: z.nativeEnum(AudienceType),
  level: z.nativeEnum(AudienceLevel),
  isExclusive: z.boolean(),
  children: z.array(z.lazy(() => AudienceTreeNodeSchema)),
});

export const AudienceTreeResponseSchema = z.array(AudienceTreeNodeSchema);
