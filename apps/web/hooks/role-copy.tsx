import { AudienceKey } from "./role-provider";

export const roleCopy: Record<
  AudienceKey,
  {
    headline: string;
    subline: string;
    primaryCta: { href: string; label: string };
    secondaryCta: { href: string; label: string };
    badges: string[];
    features: { title: string; desc: string }[];
  }
> = {
  students: {
    headline: 'Track classes, assignments & dues in one place',
    subline:
      'See attendance, download notes, submit work, and never miss a deadline.',
    primaryCta: { href: '/auth/login', label: 'Sign in as Student' },
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
    ],
  },
  parents: {
    headline: 'Stay on top of your child’s progress',
    subline:
      'Attendance, fees, announcements and results — all in a simple app.',
    primaryCta: { href: '/auth/login', label: 'Parent Login' },
    secondaryCta: { href: '#features', label: 'Explore Features' },
    badges: ['Attendance', 'Fees', 'Announcements', 'Progress'],
    features: [
      { title: 'Attendance Alerts', desc: 'Daily/weekly updates with trends.' },
      { title: 'Fees & Receipts', desc: 'Pay quickly, download receipts.' },
      { title: 'Announcements', desc: 'Stay informed about events & exams.' },
    ],
  },
  educators: {
    headline: 'Fast attendance, simple assignments, clear reports',
    subline:
      'Teachers and tutors manage classes with less admin and more teaching.',
    primaryCta: { href: '/auth/login', label: 'Educator Login' },
    secondaryCta: { href: '#features', label: 'See How It Works' },
    badges: ['Attendance', 'Assignments', 'Results', 'Messages'],
    features: [
      {
        title: '30‑second Attendance',
        desc: 'Tap‑through lists with bulk actions.',
      },
      {
        title: 'Assignment Workflow',
        desc: 'Create once, share to multiple batches.',
      },
      { title: 'Reports', desc: 'Export class performance in 1 click.' },
    ],
  },
  institutions: {
    headline: 'One platform for Schools & Colleges',
    subline: 'Organise units, roles, fees and academics — campus to classroom.',
    primaryCta: { href: '/auth/login', label: 'Admin Login' },
    secondaryCta: { href: '#features', label: 'View Capabilities' },
    badges: ['Org Units', 'Roles & Permissions', 'Fees', 'Attendance'],
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
    ],
  },
};
