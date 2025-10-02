import { Router } from 'express';
import { OrgType } from '../generated/prisma';
import { getMetaSchema, MetaSchemas } from '../lib/org-types';
import zodToJsonSchema from 'zod-to-json-schema';
import { requireAuth } from '../middleware/auth';

const r = Router();

r.get('/org-types', (_req, res) => {
  console.log(OrgType, 'check');

  res.json({ types: Object.values(OrgType) });
});

r.get('/org-types/:type', requireAuth, (req, res) => {
  const type = req.params.type as keyof typeof OrgType;
  console.log(type, 'console');
  const schema = getMetaSchema(type);
  if (!schema) return res.status(404).json({ error: 'Unknown org type' });

  const json = zodToJsonSchema(schema, { name: `OrgMeta_${type}` });
  res.json({ type, schema: json });
});

export default r;
