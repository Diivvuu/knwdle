import z from 'zod';

export const OrgIdParam = z.object({
  orgId: z.string().cuid(),
});

export type OrgIdParamDTO = z.infer<typeof OrgIdParam>;
