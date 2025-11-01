import z from 'zod';

export const OrgConnectHero = z.object({
  org: z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
  }),
  unit: z
    .object({
      id: z.string().nullable(),
      name: z.string(),
      type: z.string().nullable(),
    })
    .nullable(),
});

export const AttendanceSummary = z.object({
  totalSessions: z.number(),
  avgRate: z.number(),
  lastSessionAt: z.string().nullable(),
});

export const FeeSummary = z.object({
  totalPaid: z.number(),
  totalDue: z.number(),
  overdueCount: z.number(),
});

export const AssignmentOrTest = z.object({
  id: z.string(),
  title: z.string(),
  dueAt: z.string(),
});

export const AnnouncementItem = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
});

export const AchievementSummary = z.object({
  count: z.number(),
  latest: z.array(
    z.object({ id: z.string(), title: z.string(), awardedAt: z.string() })
  ),
});

export const ResultSummary = z.object({
  avgScore: z.number().nullable(),
  lastTestTitle: z.string().nullable(),
  lastTestDate: z.string().nullable(),
});

export const OrgConnectSummary = z.object({
  attendance: AttendanceSummary,
  assignments: z.array(AssignmentOrTest),
  tests: z.array(AssignmentOrTest),
  fees: FeeSummary,
  achievements: AchievementSummary,
  results: ResultSummary,
});

export type OrgConnectHeroType = z.infer<typeof OrgConnectHero>;
export type OrgConnectSummaryType = z.infer<typeof OrgConnectSummary>;
