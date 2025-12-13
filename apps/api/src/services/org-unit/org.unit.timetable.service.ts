import { forbidden } from '../../lib/https';
import { computeUnitFeatures } from '../../lib/org.unit.rules';
import { OrgUnitTimeTableRepo } from '../../repositories/org-unit/org.unit.timetable.repo';

export const OrgUnitTimetableService = {
  async list(orgId: string, unitId: string) {
    return OrgUnitTimeTableRepo.list(orgId, unitId);
  },
  async today(orgId: string, unitId: string) {
    const day = new Date().getDay(); //0-6
    return OrgUnitTimeTableRepo.byDay(orgId, unitId, day);
  },
  async create(orgId: string, unitId: string, body: any) {
    const unit = await OrgUnitTimeTableRepo.getUnitWithOrg(orgId, unitId);
    if (!unit) throw forbidden('Invalid unit');

    const features = computeUnitFeatures(unit.org.type, unit.type);
    if (!features.timetable) {
      throw forbidden('Timetable not enabled for this unit');
    }
    return OrgUnitTimeTableRepo.create(orgId, unitId, body);
  },
  async update(orgId: string, unitId: string, id: string, body: any) {
    return OrgUnitTimeTableRepo.update(orgId, unitId, id, body);
  },
  async remove(orgId: string, unitId: string, id: string) {
    return OrgUnitTimeTableRepo.remove(orgId, unitId, id);
  },
};
