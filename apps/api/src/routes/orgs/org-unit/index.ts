import { Router } from 'express';
import orgUnit from './org.unit.routes';
const r = Router();

r.use('/:orgId', orgUnit);

export default r;
