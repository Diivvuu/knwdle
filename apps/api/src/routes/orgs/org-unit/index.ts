import { Router } from 'express';
import orgUnit from './org.unit.routes';
import orgUnitDashboard from './org.unit.dashboard.routes';
import orgUnitAttendance from './org.unit.attendance.routes';
import orgUnitAssignment from './org.unit.assignment.routes'
import orgUnitTimetable from './org.unit.timetable.routes'

const r = Router();

r.use('/:orgId', orgUnit);
r.use('/:orgId', orgUnitDashboard);
r.use('/:orgId', orgUnitAttendance);
r.use('/:orgId', orgUnitAssignment);
r.use('/:orgId', orgUnitTimetable);

export default r;
