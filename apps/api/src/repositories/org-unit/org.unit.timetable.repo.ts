import { prisma } from '../../lib/prisma';

export const OrgUnitTimeTableRepo = {
  getUnitWithOrg(orgId: string, unitId: string) {
    return prisma.orgUnit.findFirst({
      where: { id: unitId, orgId },
      include: { org: true },
    });
  },
  list(orgId: string, unitId: string) {
    return prisma.timeTableEntry.findMany({
      where: { orgId, unitId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      include: { subject: true, teacher: true },
    });
  },
  byDay(orgId: string, unitId: string, dayOfWeek: number) {
    return prisma.timeTableEntry.findMany({
      where: { orgId, unitId, dayOfWeek },
      orderBy: { startTime: 'asc' },
      include: { subject: true, teacher: true },
    });
  },
  create(orgId: string, unitId: string, data: any) {
    return prisma.timeTableEntry.create({
      data: {
        orgId,
        unitId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room,
        mode: data.mode,
      },
    });
  },

  update(orgId: string, unitId: string, id: string, data: any) {
    return prisma.timeTableEntry.update({
      where: { id },
      data,
    });
  },
  remove(orgId: string, unitId: string, id: string) {
    return prisma.timeTableEntry.delete({ where: { id } });
  },
};
