import { z } from 'zod';
import { OrgType } from '../generated/prisma';

export const IMAGE_REF = z
  .string()
  .min(1)
  .regex(/^(https?:\/\/|(?:users|orgs)\/)[^\s]+$/i, 'Must be a URL or S3 key');

export const CreateOrgBody = z.object({
  name: z.string().trim().min(2),
  type: z.nativeEnum(OrgType),
  meta: z.unknown().optional(),
  teamSize: z.string().min(1).optional(),
});

export const UpdateOrgBody = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  teamSize: z.string().min(1).optional().nullable(),
  country: z.union([
    z.string().length(2).transform((s) => s.toUpperCase()),
    z.null(),
  ]).optional(),
  timezone: z.string().min(1).optional().nullable(),
  logoUrl: IMAGE_REF.optional().nullable(),
  coverUrl: IMAGE_REF.optional().nullable(),
  brand_color: z.string().regex(/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/).optional().nullable(),
  address: z.string().optional().nullable(),
  contactPhone: z.string().min(3).max(32).optional().nullable(),
  meta: z.unknown().optional(),
});

export const IdParam = z.object({ id: z.string().min(1) });

export const BasicError = z.object({
  error: z.string(),
  details: z.any().optional(),
});