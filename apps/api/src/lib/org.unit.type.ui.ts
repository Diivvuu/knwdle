import { OrgUnitType } from '../generated/prisma';
import { UIHint } from './org.type.ui'; // reuse same type from org.type.ui.ts

export const UNIT_UI_HINTS: Record<OrgUnitType, Record<string, UIHint>> = {
  [OrgUnitType.DEPARTMENT]: {
    headName: {
      widget: 'text',
      group: 'Basics',
      order: 10,
      placeholder: 'Department Head Name',
    },
    officeLocation: {
      widget: 'text',
      group: 'Basics',
      order: 20,
      placeholder: 'Room or Building name',
    },
    startDate: {
      widget: 'date',
      format: 'date',
      group: 'General',
      order: 30,
      help: 'When this department becomes active',
    },
    endDate: {
      widget: 'date',
      format: 'date',
      group: 'General',
      order: 31,
      help: 'When this department ends or expires',
    },
  },

  [OrgUnitType.CLASS]: {
    gradeLevel: {
      widget: 'select',
      group: 'Basics',
      order: 10,
      placeholder: 'Grade / Level',
      help: 'Example: Grade 10, Year 2, Level A',
    },
    academicYear: {
      widget: 'select',
      format: 'academicYear',
      group: 'Basics',
      order: 20,
      help: 'Academic session',
    },
    shift: {
      widget: 'radio',
      group: 'Operations',
      order: 30,
      help: 'When this class typically runs',
    },
    startDate: {
      widget: 'date',
      format: 'date',
      group: 'General',
      order: 40,
      help: 'When this class starts',
    },
    endDate: {
      widget: 'date',
      format: 'date',
      group: 'General',
      order: 41,
      help: 'When this class ends',
    },
  },

  [OrgUnitType.SECTION]: {
    groupLabel: {
      widget: 'text',
      group: 'Basics',
      order: 10,
      placeholder: 'Section name (A, B, C)',
    },
    startDate: {
      widget: 'date',
      format: 'date',
      group: 'General',
      order: 20,
      help: 'When this section starts',
    },
    endDate: {
      widget: 'date',
      format: 'date',
      group: 'General',
      order: 21,
      help: 'When this section ends',
    },
  },

  [OrgUnitType.SUBJECT]: {
    subjectCode: {
      widget: 'text',
      group: 'Basics',
      order: 10,
      placeholder: 'Unique subject code',
    },
    description: {
      widget: 'textarea',
      group: 'Basics',
      order: 20,
      placeholder: 'Short description',
    },
    credits: {
      widget: 'number',
      group: 'Academics',
      order: 30,
      unit: 'credits',
    },
    startDate: {
      widget: 'date',
      format: 'date',
      group: 'General',
      order: 40,
    },
    endDate: {
      widget: 'date',
      format: 'date',
      group: 'General',
      order: 41,
    },
  },

  [OrgUnitType.BATCH]: {
    timing: {
      widget: 'radio',
      group: 'Operations',
      order: 10,
      help: 'Batch timing (Morning / Evening / Weekend)',
    },
    capacity: {
      widget: 'stepper',
      group: 'Operations',
      order: 20,
      unit: 'students',
      help: 'Max number of students allowed',
      minLabel: 'Smaller',
      maxLabel: 'Larger',
    },
    startDate: {
      widget: 'date',
      format: 'date',
      group: 'General',
      order: 30,
    },
    endDate: {
      widget: 'date',
      format: 'date',
      group: 'General',
      order: 31,
    },
  },

  [OrgUnitType.GROUP]: {
    purpose: {
      widget: 'textarea',
      group: 'Basics',
      order: 10,
      placeholder: 'Club / Committee / House purpose',
    },
    startDate: {
      widget: 'date',
      format: 'date',
      group: 'General',
      order: 20,
    },
    endDate: {
      widget: 'date',
      format: 'date',
      group: 'General',
      order: 21,
    },
  },

  [OrgUnitType.OTHER]: {
    customTypeLabel: {
      widget: 'text',
      group: 'Basics',
      order: 10,
      placeholder: 'Display label for this unit',
    },
    startDate: {
      widget: 'date',
      format: 'date',
      group: 'General',
      order: 20,
    },
    endDate: {
      widget: 'date',
      format: 'date',
      group: 'General',
      order: 21,
    },
  },

  [OrgUnitType.ORGANISATION]: {
    startDate: {
      widget: 'date',
      format: 'date',
      group: 'General',
      order: 10,
    },
    endDate: {
      widget: 'date',
      format: 'date',
      group: 'General',
      order: 11,
    },
  },

  [OrgUnitType.ROOT]: {},
};