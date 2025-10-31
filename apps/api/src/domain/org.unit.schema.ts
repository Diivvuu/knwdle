import z from 'zod';
import { OrgUnitType } from '../generated/prisma';

export const UnitIdParam = z.object({
  orgId: z.string().cuid(),
  unitId: z.string().cuid(),
});

export const CreateOrgUnitBody = z.object({
  name: z.string().trim().min(2),
  type: z.nativeEnum(OrgUnitType),
  parentId: z.string().cuid().optional(),
  meta: z.record(z.any()).optional(),
});

export const UpdateOrgUnitBody = z.object({
  name: z.string().trim().min(2),
  meta: z.record(z.any()).optional(),
});

export const OrgUnitResponse = z.object({
  id: z.string(),
  name: z.string(),
  type: z.nativeEnum(OrgUnitType),
  orgId: z.string(),
  parentId: z.string().nullable(),
  meta: z.record(z.any().nullable()),
  features: z.record(z.string(), z.boolean()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const OrgUnitListResponse = z.array(OrgUnitResponse);

type OrgUnitTreeNode = z.infer<typeof OrgUnitResponse> & {
  children?: OrgUnitTreeNode[];
};
export const OrgUnitTreeResponse: z.ZodType<OrgUnitTreeNode[]> = z.lazy(() =>
  z.array(OrgUnitResponse.extend({ children: OrgUnitTreeResponse.optional() }))
);

/* ----------------------------- Types --------------------------- */
export type CreateOrgUnitBodyT = z.infer<typeof CreateOrgUnitBody>;
export type UpdateOrgUnitBodyT = z.infer<typeof UpdateOrgUnitBody>;
export type OrgUnitResponseT = z.infer<typeof OrgUnitResponse>;
export type OrgUnitTreeResponseT = OrgUnitTreeNode[];
