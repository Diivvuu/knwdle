import z from 'zod';

/* ---------------------------------- Base ---------------------------------- */
const BaseMeta = z.object({
  schemaVersion: z.literal(1).default(1),
  description: z.string().trim().max(500).optional(),
  features: z
    .object({
      attendance: z.boolean().default(false),
      assignments: z.boolean().default(false),
      tests: z.boolean().default(false),
      notes: z.boolean().default(true),
      fees: z.boolean().default(false),
      announcements: z.boolean().default(true),
    })
    .partial()
    .default({}),
});

/* ---------------------------------- Unit Types ---------------------------------- */

// Department — parent container
export const DepartmentMeta = BaseMeta.extend({
  head: z.string().trim().optional(),
  subjectsOffered: z.array(z.string().trim().min(2)).optional(),
  features: z.object({
    announcements: z.boolean().default(true),
  }),
});

// Class — academic group of students
export const ClassMeta = BaseMeta.extend({
  grade: z.string().trim().min(1).describe('Grade or Year'),
  section: z.string().trim().optional().describe('Section name or letter'),
  capacity: z.coerce.number().int().min(1).optional(),
  features: z.object({
    attendance: z.boolean().default(true),
    assignments: z.boolean().default(true),
    tests: z.boolean().default(true),
    notes: z.boolean().default(true),
    announcements: z.boolean().default(true),
  }),
});

// Subject — child of class or department
export const SubjectMeta = BaseMeta.extend({
  code: z.string().trim().min(2),
  credits: z.coerce.number().int().min(1).optional(),
  teacherAssigned: z.string().trim().optional(),
  features: z.object({
    attendance: z.boolean().default(true),
    assignments: z.boolean().default(true),
    tests: z.boolean().default(true),
    notes: z.boolean().default(true),
  }),
});

// Batch — group of learners inside a class or subject
export const BatchMeta = BaseMeta.extend({
  timing: z.string().trim().optional(),
  capacity: z.coerce.number().int().optional(),
  features: z.object({
    attendance: z.boolean().default(true),
    assignments: z.boolean().default(true),
  }),
});

// Utility / Club
export const ClubMeta = BaseMeta.extend({
  focusArea: z.string().trim().min(2),
  features: z.object({
    announcements: z.boolean().default(true),
  }),
});

/* ---------------------------------- Registry ---------------------------------- */

export const OrgUnitMetaSchemas = {
  department: DepartmentMeta,
  class: ClassMeta,
  subject: SubjectMeta,
  batch: BatchMeta,
  club: ClubMeta,
} as const;

export type OrgUnitType = keyof typeof OrgUnitMetaSchemas;

export function getOrgUnitMetaSchema(type: OrgUnitType) {
  return OrgUnitMetaSchemas[type];
}
