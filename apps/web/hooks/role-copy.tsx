// hooks/role-copy.ts
import type { AudienceKey } from '../providers/role-provider';

// Use lucide icon names as strings so the renderer can map them.
type LucideName =
  | 'CalendarCheck2'
  | 'ClipboardList'
  | 'BookOpen'
  | 'FileText'
  | 'Receipt'
  | 'TrendingUp'
  | 'MessageSquare'
  | 'Building2'
  | 'ShieldCheck'
  | 'LayoutDashboard';

type Step = { title: string; desc: string; icon: LucideName; media: string };

export const roleCopy: Record<
  AudienceKey,
  {
    headline: string;
    subline: string;
    primaryCta: { href: string; label: string };
    secondaryCta: { href: string; label: string };
    badges: string[];
    // keep features if you still want the “Capabilities” section later
    features: { title: string; desc: string }[];
    // NEW:
    steps: Step[];
  }
> = {
  students: {
    headline: 'Track classes, assignments & dues in one place',
    subline:
      'See attendance, download notes, submit work, and never miss a deadline.',
    primaryCta: { href: '/auth', label: 'Login' },
    secondaryCta: { href: '#features', label: 'See Features' },
    badges: ['Timetable', 'Assignments', 'Announcements', 'Results'],
    features: [
      {
        title: 'Timetable & Reminders',
        desc: 'Daily schedule, exams, auto reminders.',
      },
      { title: 'Assignments', desc: 'Submit, see feedback, track due dates.' },
      {
        title: 'Attendance View',
        desc: 'Live percentage and monthly breakdown.',
      },
      {
        title: 'Notes & Study Material',
        desc: 'One place to download class notes.',
      },
      {
        title: 'Results & Grades',
        desc: 'Check scores instantly after exams.',
      },
    ],
    steps: [
      {
        title: 'Open your timetable',
        desc: 'Classes and exams auto-organized with reminders.',
        icon: 'CalendarCheck2',
        media: '/calendar.svg', // illustration now, screenshot later
      },
      {
        title: 'Submit assignments',
        desc: 'Attach files, see due dates, get feedback in one place.',
        icon: 'ClipboardList',
        media: '/assignment.svg',
      },
      {
        title: 'Track attendance',
        desc: 'Daily updates with monthly breakdown and trends.',
        icon: 'TrendingUp',
        media: '/attendance.svg',
      },
      {
        title: 'See results instantly',
        desc: 'Scores and grade trends as soon as they’re published.',
        icon: 'FileText',
        media: '/announcement.svg',
      },
    ],
  },

  parents: {
    headline: 'Stay on top of your child’s progress',
    subline:
      'Attendance, fees, announcements and results — all in a simple app.',
    primaryCta: { href: '/auth', label: 'Login' },
    secondaryCta: { href: '#features', label: 'Explore Features' },
    badges: ['Attendance', 'Fees', 'Announcements', 'Progress'],
    features: [
      { title: 'Attendance Alerts', desc: 'Daily/weekly updates with trends.' },
      { title: 'Fees & Receipts', desc: 'Pay quickly, download receipts.' },
      { title: 'Announcements', desc: 'Stay informed about events & exams.' },
      { title: 'Progress Reports', desc: 'Track performance term by term.' },
      {
        title: 'Messages from Teachers',
        desc: 'Direct communication channel.',
      },
    ],
    steps: [
      {
        title: 'See today’s attendance',
        desc: 'A quick glance tells you how the week is going.',
        icon: 'CalendarCheck2',
        media: '/attd-chart.svg',
      },
      {
        title: 'Pay fees & get receipt',
        desc: 'Secure payments with instant receipts.',
        icon: 'Receipt',
        media: '/fee-pay.svg',
      },
      {
        title: 'Read announcements',
        desc: 'Never miss events, exams or urgent updates.',
        icon: 'MessageSquare',
        media: '/announcement.svg',
      },
      {
        title: 'Track progress',
        desc: 'Term-wise snapshots and trends.',
        icon: 'TrendingUp',
        media: '/chart.svg',
      },
    ],
  },

  educators: {
    headline: 'Fast attendance, simple assignments, clear reports',
    subline:
      'Teachers and tutors manage classes with less admin and more teaching.',
    primaryCta: { href: '/auth', label: 'Login' },
    secondaryCta: { href: '#features', label: 'See How It Works' },
    badges: ['Attendance', 'Assignments', 'Results', 'Messages'],
    features: [
      {
        title: '30-second Attendance',
        desc: 'Tap-through lists with bulk actions.',
      },
      {
        title: 'Assignment Workflow',
        desc: 'Create once, share to multiple batches.',
      },
      { title: 'Reports', desc: 'Export class performance in 1 click.' },
      { title: 'Content Sharing', desc: 'Upload notes, tests, and resources.' },
      {
        title: 'Announcements',
        desc: 'Updates to classes or groups in seconds.',
      },
    ],
    steps: [
      {
        title: 'Mark attendance in 30s',
        desc: 'Smart shortcuts and calendar view.',
        icon: 'CalendarCheck2',
        media: '/attd-chart.svg',
      },
      {
        title: 'Publish assignments',
        desc: 'Reuse templates, share across batches.',
        icon: 'ClipboardList',
        media: '/assignment.svg',
      },
      {
        title: 'Share notes & tests',
        desc: 'Central library for your class material.',
        icon: 'BookOpen',
        media: '/test.svg',
      },
      {
        title: 'Export reports',
        desc: 'One click to CSV/PDF.',
        icon: 'FileText',
        media: '/report.svg',
      },
    ],
  },

  institutions: {
    headline: 'One platform for Schools & Colleges',
    subline:
      'Organise audiences, roles, fees and academics — campus to classroom.',
    primaryCta: { href: '/auth', label: 'Login' },
    secondaryCta: { href: '#features', label: 'View Capabilities' },
    badges: ['Org Audiences', 'Roles & Permissions', 'Fees', 'Attendance'],
    features: [
      {
        title: 'Org Structure',
        desc: 'Campus → Department → Class with roles.',
      },
      {
        title: 'Fees & Billing',
        desc: 'Invoices, receipts, tax profiles, exports.',
      },
      {
        title: 'Attendance & Content',
        desc: 'Calendar + table views, notes & tests.',
      },
      {
        title: 'Analytics & Reports',
        desc: 'Trends on payments, attendance, engagement.',
      },
      {
        title: 'Role Management',
        desc: 'Granular permissions for staff & volunteers.',
      },
    ],
    steps: [
      {
        title: 'Model your org',
        desc: 'Audiences, roles and permissions — set once, reuse forever.',
        icon: 'Building2',
        media: '/manage.svg',
      },
      {
        title: 'Collect fees',
        desc: 'Receipts, tax profiles, exports.',
        icon: 'Receipt',
        media: '/cash.svg',
      },
      {
        title: 'Monitor academics',
        desc: 'Attendance, notes, tests, announcements.',
        icon: 'LayoutDashboard',
        media: '/dashboard.svg',
      },
      {
        title: 'View analytics',
        desc: 'Payments, attendance and engagement trends.',
        icon: 'TrendingUp',
        media: '/analytics.svg',
      },
    ],
  },
};
