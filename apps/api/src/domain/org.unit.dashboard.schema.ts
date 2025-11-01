import z from 'zod';

export const UnitDashParams = z.object({
  orgId: z.string().min(1, 'Org id is required'),
  unitId: z.string().min(1, 'Unit is required'),
});

export const UnitDashQuery = z.object({
  range: z.enum(['7d', '30d', '90d']).default('30d').optional(),
});

export type UnitDashParams = z.infer<typeof UnitDashParams>;
export type UnitDashRange = z.infer<typeof UnitDashQuery>['range'];
