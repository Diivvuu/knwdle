import { z } from 'zod';

export const UploadsPresignBody = z.object({
  filename: z.string().min(1),
  contentType: z
    .string()
    .regex(/^image\/(png|jpe?g|webp|svg\+xml)$/i, 'Only images allowed'),
  orgId: z.string().min(1).optional(),
});

export const UploadsPresignGetBody = z.object({
  key: z.string().min(1),
});

export const UploadsError = z.object({
  error: z.string(),
  details: z.any().optional(),
  detail: z.any().optional(),
});

export const UploadsPresignResponse = z.object({
  url: z.string().url(),
  fields: z.record(z.string()),
  key: z.string(),
});

export const UploadsPresignGetResponse = z.object({
  url: z.string().url(),
  expiresIn: z.number().int(),
});

// Types
export type UploadsPresignDTO = z.infer<typeof UploadsPresignBody>;
export type UploadsPresignGetDTO = z.infer<typeof UploadsPresignGetBody>;