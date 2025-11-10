import { Router } from 'express';
import orgUnit from './org.unit.routes';
import orgUnitDashboard from './org.unit.dashboard.routes';
import orgUnitAttendance from './org.unit.attendance.routes';

const r = Router();

r.use('/:orgId', orgUnit);
r.use('/:orgId', orgUnitDashboard);
r.use('/:orgId', orgUnitAttendance);

export default r;
