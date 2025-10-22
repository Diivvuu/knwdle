import { Router } from 'express';
import dashboard from './org.admin-dashboard.router';
import units from './org.units';
import members from './org.members';

const r = Router();

// Each sub-router is mounted at /orgs, but defines its own deeper paths.
// This keeps URLs IDENTICAL to what your Redux slice already uses.
r.use('/orgs', dashboard);
r.use('/orgs', units);
r.use('/orgs', members);

export default r;
