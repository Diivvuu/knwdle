import { z } from 'zod';
import { OrgType } from '../generated/prisma';

export const OrgTypesListResponse = z.object({
  types: z.array(z.nativeEnum(OrgType)),
});

export const OrgTypeParam = z.object({
  type: z.string().openapi?.({ example: 'COLLEGE' }) ?? z.string(),
});

export const UISchemaGroup = z.object({
  name: z.string(),
  fields: z.array(z.string()),
});

export const UISchemaResponse = z.object({
  type: z.string(),
  uiVersion: z.number(),
  definition: z.any(),
  groups: z.array(UISchemaGroup),
});

export const OrgTypePathParam = z.object({
  type: z.nativeEnum(OrgType).openapi?.({
    description: 'Organisation type',
    example: 'SCHOOL',
  }),
});

export type OrgTypeParamDTO = z.infer<typeof OrgTypeParam>;
