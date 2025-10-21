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
      help: 'Select your Board affiliation',
    },
    academicYear: {
      widget: 'select',
      format: 'academicYear',
      group: 'Basics',
      order: 30,
      help: 'Current academic session',
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
      placeholder: 'comma separated e.g. JEE, NEET',
      help: 'Add one or more courses.',
    },
  },

  [OrgType.TUITION_CENTER]: {
    focusArea: {
      widget: 'text',
      group: 'Basics',
      order: 10,
      placeholder: 'e.g. Math tutorials for Grades 8–10',
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
    accreditation: {
      widget: 'text',
      group: 'Compliance',
      order: 30,
      placeholder: 'e.g. NAAC A+, NBA',
      examples: ['NAAC A+', 'NBA', 'ABET'],
    },
  },

  [OrgType.UNIVERSITY]: {},

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
    volunteers: {
      widget: 'stepper',
      group: 'People',
      order: 30,
      unit: 'volunteers',
      help: 'Approximate active volunteers',
    },
  },
};
