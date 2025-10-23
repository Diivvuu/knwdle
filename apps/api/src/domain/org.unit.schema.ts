import { z } from 'zod';
import { OrgUnitType } from '../generated/prisma';

export const OrgIdParam = z.object({ id: z.string().min(1) });
export const UnitIdParam = z.object({
  id: z.string().min(1),
  unitId: z.string().min(1),
});

export const CreateUnitBody = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(1).max(40).optional(),
  parentId: z.string().trim().min(1).nullable().optional(),
  type: z.nativeEnum(OrgUnitType).default('OTHER'),
  meta: z.unknown().optional(),
});

export const UpdateUnitBody = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  code: z.string().trim().min(1).max(40).nullable().optional(),
  parentId: z.string().trim().min(1).nullable().optional(), // move if provided
  type: z.nativeEnum(OrgUnitType).optional(),
  meta: z.unknown().optional(),
});

export const ListUnitsQuery = z.object({
  parentId: z.string().min(1).nullable().optional(), // children of X (or roots if null)
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export const SearchUnitsQuery = z.object({
  q: z.string().trim().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export const UnitSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  parentId: z.string().nullable(),
  name: z.string(),
  code: z.string().nullable().optional(),
  path: z.string(),
  type: z.nativeEnum(OrgUnitType),
  meta: z.any().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const UnitListResponse = z.object({
  items: z.array(UnitSchema),
  nextCursor: z.string().nullable(),
});
