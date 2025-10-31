import z from 'zod';

export const IdParam = z.object({ id: z.string().min(1) });

export const ActivityQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
  unitId: z.string().min(1).optional(),
});

export const UnitsGlanceResponse = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  memberCount: z.number(),
});

export const MembersPeekResponse = z.object({
  id: z.string(),
  name: z.string().nullable(),
  role: z.string(),
  joinedAt: z.string(),
});

export const AnnouncementsPeekResponse = z.object({
  id: z.string(),
  title: z.string(),
  pin: z.boolean(),
  createdAt: z.string(),
});

export const AttendanceSnapshotResponse = z.object({
  totalSessions: z.number(),
  avgRate: z.number(),
  lastSessionAt: z.string().nullable(),
});

export const FeesSnapshotResponse = z.object({
  totalDue: z.number(),
  totalPaid: z.number(),
  overdueCount: z.number(),
});
