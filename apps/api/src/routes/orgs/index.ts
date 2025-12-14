import { Router } from 'express';
import dashboard from './org.admin-dashboard.routes';
import orgMembers from './org.members.routes';


const r = Router();

r.use('/orgs', dashboard);
r.use('/orgs', orgMembers);


export default r;
