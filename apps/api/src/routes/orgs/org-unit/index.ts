import { Router } from 'express';
import orgUnit from './org.unit.routes';
import orgUnitDashboard from './org.unit.dashboard.routes'

const r = Router();

r.use('/:orgId', orgUnit);
r.use('/:orgId', orgUnitDashboard)

export default r;
