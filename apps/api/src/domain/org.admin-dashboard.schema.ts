import z from 'zod';

export const IdParam = z.object({ id: z.string().min(1) });

export const ActivityQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
  unitId: z.string().min(1).optional(),
});

export const BasicError = z.object({
  error: z.string(),
  detail: z.any().optional(),
});
