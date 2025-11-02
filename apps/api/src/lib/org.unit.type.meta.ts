import z from 'zod';
import { OrgUnitType } from '../generated/prisma';

/**
 * Base schema for all unit metadata
 */
const BaseUnitMeta = z.object({
  schemaVersion: z.literal(1).default(1),

  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD')
    .optional()
    .describe('When this unit becomes active'),

  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD')
    .optional()
    .describe('When this unit ends or expires'),
});

/**
 * Unit-specific extensions
 */
export const DepartmentMeta = BaseUnitMeta.extend({
  headName: z.string().trim().min(2).describe('Head of Department'),
  officeLocation: z.string().trim().min(2).describe('Office / Building'),
});

export const ClassMeta = BaseUnitMeta.extend({
  gradeLevel: z.string().trim().min(1).describe('Grade / Level'),
  academicYear: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}$/i, 'Format: 2024-25')
    .describe('Academic Year'),
  shift: z.enum(['MORNING', 'EVENING', 'FULLDAY']).default('FULLDAY'),
});

export const SectionMeta = BaseUnitMeta.extend({
  groupLabel: z.string().trim().optional().describe('Section Label'),
});

export const SubjectMeta = BaseUnitMeta.extend({
  subjectCode: z.string().trim().optional().describe('Subject Code'),
  description: z.string().trim().optional().describe('Short description'),
  credits: z.coerce.number().int().min(0).optional().describe('Credit Points'),
});

export const BatchMeta = BaseUnitMeta.extend({
  timing: z
    .enum(['MORNING', 'EVENING', 'WEEKEND'])
    .default('MORNING')
    .describe('Batch timing'),
  capacity: z.coerce
    .number()
    .int()
    .min(1)
    .max(500)
    .optional()
    .describe('Max allowed members'),
});

export const GroupMeta = BaseUnitMeta.extend({
  purpose: z
    .string()
    .trim()
    .min(2)
    .describe('Group purpose (Club, Team, Committee, etc.)'),
});

export const OtherMeta = BaseUnitMeta.extend({
  customTypeLabel: z
    .string()
    .trim()
    .optional()
    .describe('Display name for custom unit type'),
});

/**
 * Registry mapping each OrgUnitType to its schema
 */
export const UnitMetaSchemas = {
  [OrgUnitType.DEPARTMENT]: DepartmentMeta,
  [OrgUnitType.CLASS]: ClassMeta,
  [OrgUnitType.SECTION]: SectionMeta,
  [OrgUnitType.SUBJECT]: SubjectMeta,
  [OrgUnitType.BATCH]: BatchMeta,
  [OrgUnitType.GROUP]: GroupMeta,
  [OrgUnitType.OTHER]: OtherMeta,
  [OrgUnitType.ORGANISATION]: BaseUnitMeta,
  [OrgUnitType.ROOT]: BaseUnitMeta,
} satisfies Record<OrgUnitType, z.ZodTypeAny>;

export function getUnitMetaSchema(type: OrgUnitType) {
  return UnitMetaSchemas[type] ?? BaseUnitMeta;
}

export type UnitMetaFor<T extends OrgUnitType> = z.infer<
  (typeof UnitMetaSchemas)[T]
>;
