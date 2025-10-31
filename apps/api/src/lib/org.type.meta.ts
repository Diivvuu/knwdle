import z from 'zod';
import { OrgType } from '../generated/prisma';

/* ------------------------------ Base (minimal) ----------------------------- */
/**
 * Keep this tiny. Only information that powers defaults/validation across modules.
 * (No feature toggles here.)
 */
const BaseMeta = z.object({
  schemaVersion: z.literal(1).default(1),
  description: z.string().trim().max(500).optional(),
  timezone: z
    .string()
    .trim()
    .optional()
    .describe('Timezone (e.g. Asia/Kolkata)'),
});

/* --------------------------- Type-specific metas --------------------------- */
/**
 * Design principle: fields must power UI defaults, validations, or reporting.
 * Avoid vanity fields (e.g., principal/chancellor names).
 */

export const SchoolMeta = BaseMeta.extend({
  board: z.enum(['CBSE', 'ICSE', 'IB', 'STATE']).describe('Board'),
  academicYear: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}$/i, 'Format: 2024-25')
    .describe('Academic year'),
  termStructure: z
    .enum(['ANNUAL', 'SEMESTER', 'TRIMESTER'])
    .default('ANNUAL')
    .describe('Academic terms'),
  grades: z
    .array(z.string().trim().min(1))
    .nonempty()
    .describe('Grades offered (e.g., 1, 2, …, 12)'),
  sectionsPreset: z
    .array(z.string().trim().min(1))
    .default([])
    .describe('Default section labels per class (e.g., A, B, C)'),
});

export const CoachingMeta = BaseMeta.extend({
  courses: z
    .array(z.string().trim().min(2))
    .nonempty()
    .describe('Courses offered (JEE, NEET, etc.)'),
  batchCadence: z
    .enum(['MONTHLY', 'QUARTERLY', 'ROLLING'])
    .default('ROLLING')
    .describe('Typical batch start cadence'),
  sessionMinutes: z.coerce
    .number()
    .int()
    .min(15)
    .max(240)
    .default(60)
    .describe('Typical session length (minutes)'),
});

export const TuitionMeta = BaseMeta.extend({
  focusArea: z
    .string()
    .trim()
    .min(2)
    .describe('Subject focus (e.g. Maths, Science)'),
  groupSize: z
    .enum(['1-1', '2-5', '6-12', '12+'])
    .default('1-1')
    .describe('Usual group size'),
  sessionMinutes: z.coerce
    .number()
    .int()
    .min(30)
    .max(180)
    .default(60)
    .describe('Typical session length (minutes)'),
});

export const CollegeMeta = BaseMeta.extend({
  affiliation: z.string().trim().min(2).describe('Affiliated University/Board'),
  departments: z.coerce.number().int().min(1).describe('Number of departments'),
  creditSystem: z.enum(['SEMESTER', 'ANNUAL']).default('SEMESTER'),
});

export const UniversityMeta = CollegeMeta.extend({
  campuses: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .describe('Number of campuses'),
});

export const EdtechMeta = BaseMeta.extend({
  productType: z.enum(['LMS', 'TUTORING', 'MARKETPLACE', 'ASSESSMENT']),
  targetAudience: z
    .array(z.enum(['schools', 'colleges', 'teachers', 'students', 'parents']))
    .nonempty(),
  deliveryMode: z.enum(['LIVE', 'ASYNC', 'BLENDED']).default('BLENDED'),
});

export const TrainingMeta = BaseMeta.extend({
  specialization: z.string().trim().min(2),
  certifications: z.array(z.enum(['ISO', 'CPD', 'INTERNAL'])).default([]),
  deliveryMode: z.enum(['ONSITE', 'ONLINE', 'HYBRID']).default('HYBRID'),
});

export const NgoMeta = BaseMeta.extend({
  registrationNumber: z.string().trim().min(3),
  focusArea: z.string().trim().min(2),
  beneficiariesMonthly: z.coerce.number().int().min(0).optional(),
});

/* ------------------------------- Registry ---------------------------------- */
export const MetaSchemas = {
  [OrgType.SCHOOL]: SchoolMeta,
  [OrgType.COACHING_CENTER]: CoachingMeta,
  [OrgType.TUITION_CENTER]: TuitionMeta,
  [OrgType.COLLEGE]: CollegeMeta,
  [OrgType.UNIVERSITY]: UniversityMeta,
  [OrgType.EDTECH]: EdtechMeta,
  [OrgType.TRAINING]: TrainingMeta,
  [OrgType.NGO]: NgoMeta,
} satisfies Record<OrgType, z.ZodTypeAny>;

/** Helper so routes can safely fetch the schema */
export function getMetaSchema(type: OrgType) {
  return MetaSchemas[type];
}

export type MetaFor<T extends OrgType> = z.infer<(typeof MetaSchemas)[T]>;
