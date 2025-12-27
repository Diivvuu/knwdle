import z from 'zod';

export const AttendanceStatusEnum = z.enum(['present', 'absent']);

export const TakeAttendanceSchema = z.object({
  date: z.string(),
  notes: z.string().optional(),
  period: z.string().min(1).optional().nullable(),
  takenById: z.string().optional(),
  records: z
    .array(
      z.object({
        studentId: z.string(),
        status: AttendanceStatusEnum,
      })
    )
    .min(1),
});

export const ListAttendanceSessionsQuery = z.object({
  date: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(25),
  cursor: z.string().optional(),
});

export const GetAttendanceSessionQuery = z.object({
  includeRecords: z.coerce.boolean().optional().default(true),
});

export const UpdateAttendanceNotesSchema = z.object({
  notes: z.string().optional().nullable(),
});

export const UpdateAttendanceRecordSchema = z.object({
  status: AttendanceStatusEnum,
});

export const StudentAttendanceHistoryQuery = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(25),
  cursor: z.string().optional(),
});
