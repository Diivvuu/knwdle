import { forbidden } from '../../lib/https';
import { computeUnitFeatures } from '../../lib/org.unit.rules';
import { OrgUnitAttendanceRepo } from '../../repositories/org-unit/org.unit.attendance.repo';

export const OrgUnitAttendanceService = {
  async listSessions(orgId: string, unitId: string) {
    return OrgUnitAttendanceRepo.listSessions(orgId, unitId);
  },
  async createSesssion(
    orgId: string,
    unitId: string,
    userId: string,
    body: any
  ) {
    const unit = await OrgUnitAttendanceRepo.getUnitWithOrg(orgId, unitId);
    if (!unit) throw forbidden('Invalid unit');

    const features = computeUnitFeatures(unit.org.type, unit.type);
    if (!features.attendance)
      throw forbidden('Attendance not enabled for this unit');

    //link with same timetable if provided
    if (body.timeTableEntryId) {
      return OrgUnitAttendanceRepo.getOrgCreateFromTimetable(
        orgId,
        unitId,
        body.timeTableEntryId
      );
    }

    return OrgUnitAttendanceRepo.createSession(orgId, unitId, userId, body);
  },

  async markAttendance(
    orgId: string,
    unitId: string,
    sessionId: string,
    userId: string,
    records: any[]
  ) {
    return OrgUnitAttendanceRepo.upsertRecords(
      orgId,
      unitId,
      sessionId,
      userId,
      records
    );
  },

  async getSession(orgId: string, unitId: string, sessionId: string) {
    return OrgUnitAttendanceRepo.getSession(orgId, unitId, sessionId);
  },

  async selfAttendance(orgId: string, unitId: string, userId: string) {
    return OrgUnitAttendanceRepo.getSelfAttendance(orgId, unitId, userId);
  },

  async getSummary(orgId: string, query: any) {
    return OrgUnitAttendanceRepo.getSummary(orgId, query);
  },
};
