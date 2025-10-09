import z from 'zod';

import { OrgType } from '../generated/prisma';

const Features = z.object({
  transport: z.boolean().default(false),
  hostel: z.boolean().default(false),
  library: z.boolean().default(false),
  fees: z.boolean().default(false),
  attendance: z.boolean().default(false),
  assignments: z.boolean().default(false),
  announcements: z.boolean().default(false),
});

const BaseMeta = z.object({
  schemaVersion: z.literal(1).default(1),
  description: z.string().trim().max(500).optional(),
  teamSize: z.coerce.number().int().min(1).optional(),
  features: Features.partial().default({}),
});

export const SchoolMeta = BaseMeta.extend({
  board: z.enum(['CBSE', 'ICSE', 'IB', 'STATE']).describe('Board'),
  academicYear: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}$/, 'Format: 2024-25')
    .describe('Academic year'),
  // override defaults appropriate for schools
  features: Features.pick({
    transport: true,
    hostel: true,
    library: true,
    fees: true,
    attendance: true,
    announcements: true,
  }).default({
    transport: false,
    hostel: false,
    library: true,
    fees: true,
    attendance: true,
    announcements: true,
  }),
});

export const CoachingMeta = BaseMeta.extend({
  courses: z
    .array(z.string().trim().min(2))
    .nonempty()
    .describe('Courses (JEE, NEET, …)'),
  features: Features.pick({
    fees: true,
    attendance: true,
    announcements: true,
  }).default({ fees: true, attendance: true, announcements: true }),
});

export const TuitionMeta = BaseMeta.extend({
  focusArea: z.string().trim().min(2).describe('Area of focus'),
  features: Features.pick({
    fees: true,
    attendance: true,
    announcements: true,
  }).default({ fees: true, attendance: true, announcements: true }),
});

export const CollegeMeta = BaseMeta.extend({
  affiliation: z.string().trim().min(2),
  departments: z.coerce.number().int().min(1),
  accreditation: z.string().trim().optional(),
  features: Features.pick({
    hostel: true,
    library: true,
    fees: true,
    attendance: true,
    announcements: true,
  }).default({
    hostel: false,
    library: true,
    fees: true,
    attendance: true,
    announcements: true,
  }),
});

// If UNIVERSITY diverges later, you can split; for now reuse:
export const UniversityMeta = CollegeMeta;

export const EdtechMeta = BaseMeta.extend({
  productType: z.enum(['LMS', 'TUTORING', 'MARKETPLACE', 'ASSESSMENT']),
  targetAudience: z
    .array(z.enum(['schools', 'colleges', 'teachers', 'students', 'parents']))
    .nonempty(),
  features: Features.pick({
    assignments: true,
    announcements: true,
    attendance: true,
    fees: true,
  }).default({
    assignments: true,
    announcements: true,
    attendance: false,
    fees: false,
  }),
});

export const TrainingMeta = BaseMeta.extend({
  specialization: z.string().trim().min(2),
  certifications: z.array(z.enum(['ISO', 'CPD', 'INTERNAL'])).default([]),
  features: Features.pick({
    assignments: true,
    attendance: true,
    announcements: true,
  }).default({ assignments: true, attendance: true, announcements: true }),
});

export const NgoMeta = BaseMeta.extend({
  registrationNumber: z.string().trim().min(3),
  focusArea: z.string().trim().min(2),
  volunteers: z.coerce.number().int().min(0).optional(),
  features: Features.pick({
    assignments: true,
    attendance: true,
    announcements: true,
  }).default({ assignments: false, attendance: true, announcements: true }),
});

/** Precise typing for schema map (discriminated by OrgType) */
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
