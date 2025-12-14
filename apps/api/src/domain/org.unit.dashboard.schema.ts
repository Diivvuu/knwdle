import z from 'zod';

export const AudienceDashParams = z.object({
  orgId: z.string().min(1, 'Org id is required'),
  audienceId: z.string().min(1, 'Audience is required'),
});

export const AudienceDashQuery = z.object({
  range: z.enum(['7d', '30d', '90d']).default('30d').optional(),
});

export type AudienceDashParams = z.infer<typeof AudienceDashParams>;
export type AudienceDashRange = z.infer<typeof AudienceDashQuery>['range'];
