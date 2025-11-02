import z, { nativeEnum } from 'zod';
import { OrgType, OrgUnitType } from '../generated/prisma';

export const OrgIdParam = z.object({
  orgId: z.string().cuid(),
});

export const OrgUnitTypeParam = z.object({
  orgId: z.string().cuid(),
  type: z.nativeEnum(OrgUnitType),
});

export const AllowedQuery = z.object({
  parentType: z.nativeEnum(OrgUnitType).nullish(),
});

export const OrgUnitTypesListResponse = z.object({
  orgType: z.nativeEnum(OrgType),
  types: z.array(nativeEnum(OrgUnitType)),
  featureDefaults: z.record(
    z.nativeEnum(OrgUnitType),
    z.record(z.string(), z.boolean()).optional()
  ),
});

/* ------------------------ UI schema + groups --------------------------- */
export const OrgUnitUISchemaResponse = z.object({
  orgType: z.nativeEnum(OrgType),
  unitType: z.nativeEnum(OrgUnitType),
  uiVersion: z.number().default(1),
  definition: z.record(z.any()),
  groups: z.array(
    z.object({
      name: z.string(),
      fields: z.array(z.string()),
    })
  ),
});

/* ------------------------ Features per unit type ------------------------ */
export const OrgUnitFeaturesResponse = z.object({
  orgType: z.string(),
  unitType: z.string(),
  features: z.record(z.boolean()),
});

/* ------------------------ Allowed child units --------------------------- */
export const AllowedChildrenResponse = z.object({
  orgType: z.nativeEnum(OrgType),
  parentType: z.nativeEnum(OrgUnitType).nullable(),
  allowed: z.array(z.nativeEnum(OrgUnitType)),
});

/* ----------------------------- Type exports ----------------------------- */
export type OrgUnitTypesListResponseT = z.infer<
  typeof OrgUnitTypesListResponse
>;
export type OrgUnitUISchemaResponseT = z.infer<
  typeof OrgUnitUISchemaResponse
>;
export type AllowedChildrenResponseT = z.infer<
  typeof AllowedChildrenResponse
>;