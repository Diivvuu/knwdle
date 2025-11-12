import { OrgUnitAssignmentRepo } from '../../repositories/org-unit/org.unit.assignments.repo';
import { OrgUnitAttendanceRepo } from '../../repositories/org-unit/org.unit.attendance.repo';

export const OrgUnitAssignmentService = {
  async listAssignments(orgId: string, unitId: string, query: any) {
    return OrgUnitAssignmentRepo.list(orgId, unitId, query);
  },

  async create(orgId: string, unitId: string, userId: string, body: any) {
    return OrgUnitAttendanceRepo.createSession(orgId, unitId, userId, body);
  },

  async get(orgId: string, unitId: string, id: string) {
    return OrgUnitAssignmentRepo.get(orgId, unitId, id);
  },

  async update(orgId: string, unitId: string, id: string, body: any) {
    return OrgUnitAssignmentRepo.update(orgId, unitId, id, body);
  },

  async remove(orgId: string, unitId: string, id: string) {
    return OrgUnitAssignmentRepo.remove(orgId, unitId, id);
  },

  async submit(
    orgId: string,
    unitId: string,
    id: string,
    studentId: string,
    body: any
  ) {
    return OrgUnitAssignmentRepo.submit(orgId, unitId, id, studentId, body);
  },

  async listSubmissions(orgId: string, unitId: string, id: string, query: any) {
    return OrgUnitAssignmentRepo.listSubmissions(orgId, unitId, id, query);
  },

  async grade(orgId: string, unitId: string, id: string, body: any) {
    return OrgUnitAssignmentRepo.grade(orgId, unitId, id, body);
  },
};
