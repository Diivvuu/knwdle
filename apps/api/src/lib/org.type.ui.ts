import { OrgType } from '../generated/prisma';

export type UIHint = {
  /** Which control to render */
  widget?:
    | 'select'
    | 'stepper'
    | 'chips'
    | 'textarea'
    | 'radio'
    | 'pillset'
    | 'switch'
    | 'text'
    | 'number';

  /** Grouping & order */
  group?: string; // e.g., "Basics", "Academics"
  order?: number; // stable sort inside group
  layout?: 'full' | 'half'; // grid hints

  /** UX sugar */
  placeholder?: string;
  help?: string;
  unit?: string; // e.g., "depts", "volunteers"
  examples?: string[];
  suggestions?: string[]; // chips/autocomplete
  transform?: 'uppercase' | 'titlecase' | 'trim';
  format?: 'academicYear' | 'phone' | 'email' | 'url';

  /** Conditional visibility */
  visibleIf?: { field: string; equals: any };
  minLabel?: string;
  maxLabel?: string;
};

type UIHintsPerType = Record<string, UIHint>;

export const UI_HINTS: Record<OrgType, UIHintsPerType> = {
  [OrgType.SCHOOL]: {
    description: {
      widget: 'textarea',
      group: 'Basics',
      order: 10,
      placeholder: 'Brief overview of the school',
      help: 'Max 500 characters.',
      layout: 'full',
    },
    board: {
      widget: 'select',
      group: 'Basics',
      order: 20,
      help: 'Select your board affiliation',
    },
    academicYear: {
      widget: 'select',
      format: 'academicYear',
      group: 'Basics',
      order: 30,
      help: 'Current academic session',
    },
    termStructure: {
      widget: 'radio',
      group: 'Academics',
      order: 40,
      help: 'How your academic year is structured',
    },
    grades: {
      widget: 'chips',
      group: 'Academics',
      order: 50,
      placeholder: 'e.g. 1, 2, …, 12',
      help: 'Add the grades you run (use numbers or short labels).',
    },
    sectionsPreset: {
      widget: 'chips',
      group: 'Academics',
      order: 60,
      placeholder: 'A, B, C',
      help: 'Default section labels for new classes',
    },
  },

  [OrgType.COACHING_CENTER]: {
    description: {
      widget: 'textarea',
      group: 'Basics',
      order: 10,
      placeholder: 'Tell us about your coaching center',
      help: 'Max 500 characters.',
    },
    courses: {
      widget: 'chips',
      group: 'Academics',
      order: 20,
      suggestions: ['JEE', 'NEET', 'CUET', 'CAT', 'GATE'],
      placeholder: 'JEE, NEET, …',
      help: 'Add one or more courses.',
    },
    batchCadence: {
      widget: 'radio',
      group: 'Operations',
      order: 30,
      help: 'How often do batches typically start?',
    },
    sessionMinutes: {
      widget: 'stepper',
      group: 'Operations',
      order: 40,
      unit: 'min',
      help: 'Usual session length',
      minLabel: 'Shorter',
      maxLabel: 'Longer',
    },
  },

  [OrgType.TUITION_CENTER]: {
    focusArea: {
      widget: 'text',
      group: 'Basics',
      order: 10,
      placeholder: 'e.g. Math tutorials for Grades 8–10',
    },
    groupSize: {
      widget: 'select',
      group: 'Operations',
      order: 20,
      help: 'Usual group size',
    },
    sessionMinutes: {
      widget: 'stepper',
      group: 'Operations',
      order: 30,
      unit: 'min',
      help: 'Usual session length',
      minLabel: 'Shorter',
      maxLabel: 'Longer',
    },
  },

  [OrgType.COLLEGE]: {
    affiliation: {
      widget: 'text',
      group: 'Basics',
      order: 10,
      placeholder: 'Affiliated University/Board',
      transform: 'trim',
    },
    departments: {
      widget: 'stepper',
      group: 'Academics',
      order: 20,
      unit: 'depts',
      help: 'How many academic departments?',
      minLabel: 'Fewer',
      maxLabel: 'More',
    },
    creditSystem: {
      widget: 'radio',
      group: 'Academics',
      order: 30,
      help: 'Calendar structure for programmes',
    },
  },

  [OrgType.UNIVERSITY]: {
    campuses: {
      widget: 'stepper',
      group: 'Basics',
      order: 10,
      unit: 'campuses',
      help: 'How many campuses (optional)?',
    },
  },

  [OrgType.EDTECH]: {
    productType: {
      widget: 'select',
      group: 'Product',
      order: 10,
    },
    targetAudience: {
      widget: 'pillset',
      group: 'Product',
      order: 20,
      help: 'Who primarily uses your product?',
    },
    deliveryMode: {
      widget: 'radio',
      group: 'Product',
      order: 30,
      help: 'Primary delivery mode',
    },
  },

  [OrgType.TRAINING]: {
    specialization: {
      widget: 'text',
      group: 'Basics',
      order: 10,
      placeholder: 'e.g. Cloud DevOps, Data Analytics',
    },
    certifications: {
      widget: 'pillset',
      group: 'Compliance',
      order: 20,
      help: 'Applicable certifications',
    },
    deliveryMode: {
      widget: 'radio',
      group: 'Operations',
      order: 30,
      help: 'How you usually deliver trainings',
    },
  },

  [OrgType.NGO]: {
    registrationNumber: {
      widget: 'text',
      group: 'Basics',
      order: 10,
      placeholder: 'Official registration number',
      transform: 'uppercase',
    },
    focusArea: {
      widget: 'text',
      group: 'Programs',
      order: 20,
      placeholder: 'Primary area of work',
    },
    beneficiariesMonthly: {
      widget: 'stepper',
      group: 'Impact',
      order: 30,
      unit: 'per month',
      help: 'Approx. beneficiaries served each month (optional)',
    },
  },
};
