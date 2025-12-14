// packages/ui/constants/audienceFeatureMap.ts
import {
  CalendarDays,
  BookOpen,
  ScrollText,
  FileText,
  Bell,
  Folder,
  Coins,
  Trophy,
  BarChart3,
  Video,
  Users2,
  Presentation,
} from 'lucide-react';

export const UNIT_FEATURE_MAP = {
  attendance: {
    label: 'Attendance',
    icon: CalendarDays,
    path: 'attendance',
  },
  assignments: {
    label: 'Assignments',
    icon: BookOpen,
    path: 'assignments',
  },
  tests: {
    label: 'Tests',
    icon: ScrollText,
    path: 'tests',
  },
  notes: {
    label: 'Notes',
    icon: FileText,
    path: 'notes',
  },
  announcements: {
    label: 'Announcements',
    icon: Bell,
    path: 'announcements',
  },
  content: {
    label: 'Content',
    icon: Folder,
    path: 'content',
  },
  fees: {
    label: 'Fees',
    icon: Coins,
    path: 'fees',
  },
  liveClass: {
    label: 'Live Classes',
    icon: Video,
    path: 'live-classes',
  },
  interactions: {
    label: 'Interactions',
    icon: Users2,
    path: 'interactions',
  },
  timetable: {
    label: 'Timetable',
    icon: Presentation,
    path: 'timetable',
  },
  results: {
    label: 'Results',
    icon: BarChart3,
    path: 'results',
  },
  achievements: {
    label: 'Achievements',
    icon: Trophy,
    path: 'achievements',
  },
} as const;

export type AudienceFeatureKey = keyof typeof UNIT_FEATURE_MAP;
