import { OrgUnitType } from '../generated/prisma';
import {
  OrgUnitTypesListResponseT,
  OrgUnitUISchemaResponseT,
  AllowedChildrenResponseT,
} from '../domain/org.unit-types.schema';
import {
  ALLOWED_CHILDREN,
  computeAllowedChildren,
  FEATURE_DEFAULTS,
} from '../lib/org.unit.rules';
import { OrgRepo } from '../repositories/org.repo';

/** Core metadata schema builder for unit meta fields */
function buildMetaSchema(
  unitType: OrgUnitType
): OrgUnitUISchemaResponseT['schema'] {
  const base = {
    startDate: {
      type: 'string',
      format: 'date-time',
      title: 'Start Date',
      description: 'When this unit becomes active',
    },
    endDate: {
      type: 'string',
      format: 'date-time',
      title: 'End Date',
      description: 'When this unit ends or expires',
    },
  };

  const typeSpecific: Partial<Record<OrgUnitType, Record<string, any>>> = {
    [OrgUnitType.SUBJECT]: {
      subjectCode: {
        type: 'string',
        title: 'Subject Code',
        description: 'Unique subject identifier (optional)',
      },
      description: {
        type: 'string',
        title: 'Description',
        description: 'Brief overview of the subject',
      },
      credits: {
        type: 'number',
        title: 'Credits',
        description: 'Applicable for higher education courses',
      },
    },
    [OrgUnitType.CLASS]: {
      gradeLevel: {
        type: 'string',
        title: 'Grade / Level',
        description: 'Example: Grade 10, Year 2, Level A',
      },
      academicYear: {
        type: 'string',
        title: 'Academic Year',
        description: 'Format: 2024–25',
      },
    },
    [OrgUnitType.BATCH]: {
      timing: {
        type: 'string',
        title: 'Batch Timing',
        description: 'Morning / Evening / Weekend, etc.',
      },
      capacity: {
        type: 'number',
        title: 'Capacity',
        description: 'Maximum allowed members',
      },
    },
    [OrgUnitType.GROUP]: {
      purpose: {
        type: 'string',
        title: 'Group Purpose',
        description: 'Club / Team / Committee / House, etc.',
      },
    },
    [OrgUnitType.DEPARTMENT]: {
      headName: {
        type: 'string',
        title: 'Head of Department',
        description: 'Department head or coordinator name',
      },
      officeLocation: {
        type: 'string',
        title: 'Office Location',
        description: 'Room or building name',
      },
    },
  };

  const fields = { ...base, ...(typeSpecific[unitType] || {}) };

  return {
    type: 'object',
    title: `${unitType} Metadata`,
    properties: fields,
  };
}

export const OrgUnitTypesService = {
  async list(orgId: string): Promise<OrgUnitTypesListResponseT> {
    const orgRecord = await OrgRepo.getOrgTypeById(orgId);
    if (!orgRecord) throw new Error('Organisation not found');
    const orgType = orgRecord.type;

    const set = new Set<OrgUnitType>();
    const map = ALLOWED_CHILDREN[orgType] ?? {};
    for (const arr of Object.values(map))
      (arr || []).forEach((t) => set.add(t));

    return {
      orgType,
      types: Array.from(set),
      featureDefaults: FEATURE_DEFAULTS[orgType] ?? {},
    };
  },

  async getSchema(
    orgId: string,
    type: OrgUnitType
  ): Promise<OrgUnitUISchemaResponseT> {
    const orgRecord = await OrgRepo.getOrgTypeById(orgId);
    if (!orgRecord) throw new Error('Organisation not found');
    const orgType = orgRecord.type;
    return {
      orgType,
      unitType: type,
      schema: buildMetaSchema(type),
    };
  },

  async getFeatures(orgId: string, type: OrgUnitType) {
    const orgRecord = await OrgRepo.getOrgTypeById(orgId);
    if (!orgRecord) throw new Error('Organisation not found');
    const orgType = orgRecord.type;
    const features = (FEATURE_DEFAULTS[orgType] ?? {})[type] ?? {};
    return { orgType, unitType: type, features };
  },

  async allowed(
    orgId: string,
    parentType: OrgUnitType | null
  ): Promise<AllowedChildrenResponseT> {
    const orgRecord = await OrgRepo.getOrgTypeById(orgId);
    if (!orgRecord) throw new Error('Organisation not found');
    const orgType = orgRecord.type;
    const allowed = computeAllowedChildren(orgType, parentType);
    return { orgType, parentType, allowed };
  },
};
