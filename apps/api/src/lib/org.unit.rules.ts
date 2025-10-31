// apps/api/src/lib/org-unit.rules.ts
import { OrgType, OrgUnitType } from '../generated/prisma';

export type FeatureKey =
  | 'attendance'
  | 'assignments'
  | 'tests'
  | 'notes'
  | 'fees'
  | 'announcements'
  | 'content'
  | 'liveClass'
  | 'interactions'
  | 'timetable'
  | 'results'
  | 'achievements';

export type FeatureFlags = Record<FeatureKey, boolean>;

/** Helper: turn list of ON features → full flags */
function on(...keys: FeatureKey[]): FeatureFlags {
  const base: FeatureFlags = {
    attendance: false,
    assignments: false,
    tests: false,
    notes: false,
    fees: false,
    announcements: false,
    content: false,
    liveClass: false,
    interactions: false,
    timetable: false,
    results: false,
    achievements: false,
  };
  keys.forEach((k) => (base[k] = true));
  return base;
}

/** ===== ALLOWED CHILD TYPES per OrgType & Parent Unit Type ===== */
export const ALLOWED_CHILDREN: Record<
  OrgType,
  Partial<Record<OrgUnitType, OrgUnitType[]>>
> = {
  [OrgType.SCHOOL]: {
    [OrgUnitType.ORGANISATION]: [
      OrgUnitType.DEPARTMENT,
      OrgUnitType.CLASS,
      OrgUnitType.GROUP,
      OrgUnitType.OTHER,
    ],
    [OrgUnitType.DEPARTMENT]: [
      OrgUnitType.CLASS,
      OrgUnitType.GROUP,
      OrgUnitType.OTHER,
    ],
    [OrgUnitType.CLASS]: [
      OrgUnitType.SECTION,
      OrgUnitType.SUBJECT,
      OrgUnitType.GROUP,
      OrgUnitType.BATCH,
      OrgUnitType.OTHER,
    ],
    [OrgUnitType.SECTION]: [
      OrgUnitType.SUBJECT,
      OrgUnitType.GROUP,
      OrgUnitType.BATCH,
      OrgUnitType.OTHER,
    ],
    [OrgUnitType.SUBJECT]: [
      OrgUnitType.GROUP,
      OrgUnitType.BATCH,
      OrgUnitType.OTHER,
    ],
    [OrgUnitType.BATCH]: [OrgUnitType.GROUP, OrgUnitType.OTHER],
    [OrgUnitType.GROUP]: [OrgUnitType.OTHER],
  },

  [OrgType.COACHING_CENTER]: {
    [OrgUnitType.ORGANISATION]: [
      OrgUnitType.CLASS,
      OrgUnitType.GROUP,
      OrgUnitType.OTHER,
    ],
    [OrgUnitType.CLASS]: [
      OrgUnitType.BATCH,
      OrgUnitType.SUBJECT,
      OrgUnitType.GROUP,
      OrgUnitType.OTHER,
    ],
    [OrgUnitType.BATCH]: [OrgUnitType.GROUP, OrgUnitType.OTHER],
    [OrgUnitType.SUBJECT]: [
      OrgUnitType.GROUP,
      OrgUnitType.BATCH,
      OrgUnitType.OTHER,
    ],
    [OrgUnitType.GROUP]: [OrgUnitType.OTHER],
  },

  [OrgType.TUITION_CENTER]: {
    [OrgUnitType.ORGANISATION]: [
      OrgUnitType.CLASS,
      OrgUnitType.GROUP,
      OrgUnitType.OTHER,
    ],
    [OrgUnitType.CLASS]: [
      OrgUnitType.BATCH,
      OrgUnitType.SUBJECT,
      OrgUnitType.GROUP,
      OrgUnitType.OTHER,
    ],
    [OrgUnitType.BATCH]: [OrgUnitType.GROUP, OrgUnitType.OTHER],
    [OrgUnitType.SUBJECT]: [OrgUnitType.GROUP, OrgUnitType.OTHER],
    [OrgUnitType.GROUP]: [OrgUnitType.OTHER],
  },

  [OrgType.COLLEGE]: {
    [OrgUnitType.ORGANISATION]: [
      OrgUnitType.DEPARTMENT,
      OrgUnitType.GROUP,
      OrgUnitType.OTHER,
    ],
    [OrgUnitType.DEPARTMENT]: [
      OrgUnitType.CLASS,
      OrgUnitType.GROUP,
      OrgUnitType.OTHER,
    ],
    [OrgUnitType.CLASS]: [
      OrgUnitType.SUBJECT,
      OrgUnitType.GROUP,
      OrgUnitType.OTHER,
    ],
    [OrgUnitType.SUBJECT]: [OrgUnitType.GROUP, OrgUnitType.OTHER],
    [OrgUnitType.GROUP]: [OrgUnitType.OTHER],
  },

  [OrgType.UNIVERSITY]: {
    [OrgUnitType.ORGANISATION]: [
      OrgUnitType.DEPARTMENT,
      OrgUnitType.GROUP,
      OrgUnitType.OTHER,
    ],
    [OrgUnitType.DEPARTMENT]: [
      OrgUnitType.CLASS,
      OrgUnitType.GROUP,
      OrgUnitType.OTHER,
    ],
    [OrgUnitType.CLASS]: [
      OrgUnitType.SUBJECT,
      OrgUnitType.GROUP,
      OrgUnitType.OTHER,
    ],
    [OrgUnitType.SUBJECT]: [OrgUnitType.GROUP, OrgUnitType.OTHER],
    [OrgUnitType.GROUP]: [OrgUnitType.OTHER],
  },

  [OrgType.TRAINING]: {
    [OrgUnitType.ORGANISATION]: [
      OrgUnitType.CLASS,
      OrgUnitType.GROUP,
      OrgUnitType.OTHER,
    ],
    [OrgUnitType.CLASS]: [
      OrgUnitType.BATCH,
      OrgUnitType.SUBJECT,
      OrgUnitType.GROUP,
      OrgUnitType.OTHER,
    ],
    [OrgUnitType.BATCH]: [OrgUnitType.GROUP, OrgUnitType.OTHER],
    [OrgUnitType.SUBJECT]: [OrgUnitType.GROUP, OrgUnitType.OTHER],
    [OrgUnitType.GROUP]: [OrgUnitType.OTHER],
  },

  [OrgType.NGO]: {
    [OrgUnitType.ORGANISATION]: [
      OrgUnitType.DEPARTMENT,
      OrgUnitType.GROUP,
      OrgUnitType.OTHER,
    ],
    [OrgUnitType.DEPARTMENT]: [OrgUnitType.GROUP, OrgUnitType.OTHER],
    [OrgUnitType.GROUP]: [OrgUnitType.OTHER],
  },

  [OrgType.EDTECH]: {
    [OrgUnitType.ORGANISATION]: [
      OrgUnitType.CLASS,
      OrgUnitType.GROUP,
      OrgUnitType.OTHER,
    ],
    [OrgUnitType.CLASS]: [
      OrgUnitType.SUBJECT,
      OrgUnitType.BATCH,
      OrgUnitType.GROUP,
      OrgUnitType.OTHER,
    ],
    [OrgUnitType.SUBJECT]: [OrgUnitType.GROUP, OrgUnitType.OTHER],
    [OrgUnitType.BATCH]: [OrgUnitType.GROUP, OrgUnitType.OTHER],
    [OrgUnitType.GROUP]: [OrgUnitType.OTHER],
  },
};

/** ===== FEATURE DEFAULTS per OrgType + Unit Type ===== */
export const FEATURE_DEFAULTS: Record<
  OrgType,
  Partial<Record<OrgUnitType, FeatureFlags>>
> = {
  [OrgType.SCHOOL]: {
    [OrgUnitType.ORGANISATION]: on('fees', 'announcements', 'content'),
    [OrgUnitType.DEPARTMENT]: on('announcements'),
    [OrgUnitType.CLASS]: on(
      'attendance',
      'assignments',
      'tests',
      'notes',
      'announcements',
      'liveClass'
    ),
    [OrgUnitType.SECTION]: on(
      'attendance',
      'assignments',
      'tests',
      'notes',
      'announcements',
      'liveClass'
    ),
    [OrgUnitType.SUBJECT]: on(
      'attendance',
      'assignments',
      'tests',
      'notes',
      'announcements',
      'content',
      'liveClass'
    ),
    [OrgUnitType.BATCH]: on(
      'attendance',
      'assignments',
      'announcements',
      'liveClass'
    ),
    [OrgUnitType.GROUP]: on('announcements', 'interactions'),
    [OrgUnitType.OTHER]: on('announcements'),
  },

  [OrgType.COACHING_CENTER]: {
    [OrgUnitType.ORGANISATION]: on('fees', 'announcements', 'content'),
    [OrgUnitType.CLASS]: on(
      'attendance',
      'assignments',
      'tests',
      'notes',
      'announcements',
      'content',
      'liveClass'
    ),
    [OrgUnitType.BATCH]: on(
      'attendance',
      'assignments',
      'announcements',
      'liveClass'
    ),
    [OrgUnitType.SUBJECT]: on(
      'attendance',
      'assignments',
      'tests',
      'notes',
      'announcements',
      'content',
      'liveClass'
    ),
    [OrgUnitType.GROUP]: on('announcements', 'interactions'),
    [OrgUnitType.OTHER]: on('announcements'),
  },

  [OrgType.TUITION_CENTER]: {
    [OrgUnitType.ORGANISATION]: on('fees', 'announcements', 'content'),
    [OrgUnitType.CLASS]: on(
      'attendance',
      'assignments',
      'tests',
      'notes',
      'announcements',
      'liveClass'
    ),
    [OrgUnitType.BATCH]: on(
      'attendance',
      'assignments',
      'announcements',
      'liveClass'
    ),
    [OrgUnitType.SUBJECT]: on(
      'attendance',
      'assignments',
      'tests',
      'notes',
      'announcements',
      'liveClass'
    ), // keep content off by default
    [OrgUnitType.GROUP]: on('announcements', 'interactions'),
    [OrgUnitType.OTHER]: on('announcements'),
  },

  [OrgType.COLLEGE]: {
    [OrgUnitType.ORGANISATION]: on('fees', 'announcements', 'content'),
    [OrgUnitType.DEPARTMENT]: on('announcements'),
    [OrgUnitType.CLASS]: on(
      'attendance',
      'assignments',
      'tests',
      'notes',
      'announcements',
      'liveClass'
    ),
    [OrgUnitType.SUBJECT]: on(
      'attendance',
      'assignments',
      'tests',
      'notes',
      'announcements',
      'content',
      'liveClass'
    ),
    [OrgUnitType.GROUP]: on('announcements', 'interactions'),
    [OrgUnitType.OTHER]: on('announcements'),
  },

  [OrgType.UNIVERSITY]: {
    [OrgUnitType.ORGANISATION]: on('fees', 'announcements', 'content'),
    [OrgUnitType.DEPARTMENT]: on('announcements'),
    [OrgUnitType.CLASS]: on(
      'attendance',
      'assignments',
      'tests',
      'notes',
      'announcements',
      'liveClass'
    ),
    [OrgUnitType.SUBJECT]: on(
      'attendance',
      'assignments',
      'tests',
      'notes',
      'announcements',
      'content',
      'liveClass'
    ),
    [OrgUnitType.GROUP]: on('announcements', 'interactions'),
    [OrgUnitType.OTHER]: on('announcements'),
  },

  [OrgType.TRAINING]: {
    [OrgUnitType.ORGANISATION]: on('fees', 'announcements', 'content'),
    [OrgUnitType.CLASS]: on(
      'attendance',
      'assignments',
      'tests',
      'notes',
      'announcements',
      'liveClass'
    ),
    [OrgUnitType.BATCH]: on(
      'attendance',
      'assignments',
      'announcements',
      'liveClass'
    ),
    [OrgUnitType.SUBJECT]: on(
      'attendance',
      'assignments',
      'tests',
      'notes',
      'announcements',
      'content',
      'liveClass'
    ),
    [OrgUnitType.GROUP]: on('announcements', 'interactions'),
    [OrgUnitType.OTHER]: on('announcements'),
  },

  [OrgType.NGO]: {
    [OrgUnitType.ORGANISATION]: on('announcements', 'content'),
    [OrgUnitType.DEPARTMENT]: on('announcements'),
    [OrgUnitType.GROUP]: on('announcements', 'interactions'),
    [OrgUnitType.OTHER]: on('announcements'),
  },

  [OrgType.EDTECH]: {
    [OrgUnitType.ORGANISATION]: on('fees', 'announcements', 'content'),
    [OrgUnitType.CLASS]: on(
      'assignments',
      'tests',
      'notes',
      'announcements',
      'content',
      'liveClass'
    ),
    [OrgUnitType.SUBJECT]: on(
      'assignments',
      'tests',
      'notes',
      'announcements',
      'content',
      'liveClass'
    ),
    [OrgUnitType.BATCH]: on(
      'attendance',
      'assignments',
      'announcements',
      'liveClass'
    ),
    [OrgUnitType.GROUP]: on('announcements', 'interactions'),
    [OrgUnitType.OTHER]: on('announcements'),
  },
};

export function computeAllowedChildren(
  orgType: OrgType,
  parentType: OrgUnitType | null
): OrgUnitType[] {
  if (!parentType) {
    return [OrgUnitType.ROOT];
  }

  if (parentType === OrgUnitType.ROOT) {
    return [OrgUnitType.ORGANISATION];
  }

  return ALLOWED_CHILDREN[orgType][parentType] ?? [];
}

export function computeUnitFeatures(
  orgType: OrgType,
  unitType: OrgUnitType
): FeatureFlags {
  const byType = FEATURE_DEFAULTS[orgType] ?? {};
  const flags = { ...(byType[unitType] ?? on()) };

  //  Attendance: only for actual learning/delivery units
  if (
    unitType === OrgUnitType.CLASS ||
    unitType === OrgUnitType.SECTION ||
    unitType === OrgUnitType.SUBJECT ||
    unitType === OrgUnitType.BATCH
  ) {
    flags.attendance = true;
  }

  //  Timetable: only where scheduling matters
  if (
    unitType === OrgUnitType.CLASS ||
    unitType === OrgUnitType.SECTION ||
    unitType === OrgUnitType.BATCH
  ) {
    flags.timetable = true;
  }

  //  Results: for academic evaluation contexts
  if (
    unitType === OrgUnitType.CLASS ||
    unitType === OrgUnitType.SECTION ||
    unitType === OrgUnitType.SUBJECT ||
    unitType === OrgUnitType.BATCH
  ) {
    flags.results = true;
  }

  //  Achievements: tracked at class level only
  if (unitType === OrgUnitType.CLASS) {
    flags.achievements = true;
  }

  return flags;
}

export type UnitStatus = 'UPCOMING' | 'ACTIVE' | 'EXPIRED';
export function computeUnitStatus(meta: any, now = new Date()): UnitStatus {
  const s = meta?.startDate ? new Date(meta.startDate) : null;
  const e = meta?.endDate ? new Date(meta.endDate) : null;
  if (s && now < s) return 'UPCOMING';
  if (e && now > e) return 'EXPIRED';
  return 'ACTIVE';
}
