import { Router } from 'express';
import dashboard from './org.admin-dashboard.routes';
import orgUnitTypes from './org.unit-types.routes';
import orgUnit from './org-unit';
import orgMembers from './org.members.routes'
const r = Router();

// Each sub-router is mounted at /orgs, but defines its own deeper paths.
// This keeps URLs IDENTICAL to what your Redux slice already uses.
r.use('/orgs', dashboard);
r.use('/orgs', orgUnitTypes);
r.use('/orgs', orgUnit);
r.use('/orgs', orgMembers);

export default r;
