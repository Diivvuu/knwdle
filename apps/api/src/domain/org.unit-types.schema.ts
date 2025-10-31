import z, { nativeEnum } from 'zod';
import { OrgType, OrgUnitType } from '../generated/prisma';

export const OrgIdParam = z.object({
  orgId: z.string().cuid(),
});

export const orgUnitTypeParam = z.object({
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

export const OrgUnitUISchemaResponse = z.object({
  orgType: z.nativeEnum(OrgType),
  unitType: z.nativeEnum(OrgUnitType),
  schema: z.object({
    type: z.literal('object'),
    title: z.string(),
    properties: z.record(
      z.string(),
      z.object({
        type: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        format: z.string().optional(),
      })
    ),
  }),
});

export const OrgUnitFeaturesResponse = z.object({
  orgType: z.string(),
  unitType: z.string(),
  features: z.record(z.boolean()),
});

export const AllowedChildrenResponse = z.object({
  orgType: z.nativeEnum(OrgType),
  parentType: z.nativeEnum(OrgUnitType).nullable(),
  allowed: z.array(z.nativeEnum(OrgUnitType)),
});

export type OrgUnitTypesListResponseT = z.infer<
  typeof OrgUnitTypesListResponse
>;
export type OrgUnitUISchemaResponseT = z.infer<typeof OrgUnitUISchemaResponse>;
export type AllowedChildrenResponseT = z.infer<typeof AllowedChildrenResponse>;
