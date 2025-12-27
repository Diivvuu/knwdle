import z from 'zod';
import { ParentRole } from '../generated/prisma';

export const ListAudienceMembersQuery = z.object({
  role: z.nativeEnum(ParentRole).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().optional(),
  cursor: z.string().optional(),
});

export const AddAudienceMemberBody = z.object({
  userId: z.string().cuid(),
  role: z.nativeEnum(ParentRole),
  roleId: z.string().cuid().optional(),
});

export const MoveStudentSchema = z.object({
  studentId: z.string().cuid(),
  fromAudienceId: z.string().cuid(),
  toAudienceId: z.string().cuid(),
});

export type MoveStudentBody = z.infer<typeof MoveStudentSchema>