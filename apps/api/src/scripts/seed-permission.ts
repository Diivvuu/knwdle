import { prisma } from '../lib/prisma';

const CODES = [
  { code: 'org.read', name: 'Read organisation' },
  { code: 'org.update', name: 'Update organisation settings' },
  { code: 'org.unit.manage', name: 'Manage units' },
  { code: 'org.units.forceDelete', name: 'Force-delete non-empty unit' }, // ⬅️ NEW
  { code: 'people.invite', name: 'Send invites' },
  { code: 'people.manage', name: 'Manage members and roles' },
  { code: 'people.view', name: 'View members list' },
  { code: 'roles.manage', name: 'Manage custom roles & permissions' },
  { code: 'teaching.content.manage', name: 'Manage content' },
  { code: 'teaching.attendance.manage', name: 'Manage attendance' },
  { code: 'comms.announce.manage', name: 'Manage announcements' },
  { code: 'finance.invoice.manage', name: 'Manage invoices' },
  { code: 'finance.payment.manage', name: 'Manage payments' },
  { code: 'reports.read', name: 'Read reports' },
  { code: 'reports.export', name: 'Export reports' },
];

async function main() {
  for (const p of CODES) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: { name: p.name },
      create: p,
    });
  }
}

main().finally(() => prisma.$disconnect());
