import { Router } from 'express';
import {
  getOrgUnitMetaSchema,
  OrgUnitMetaSchemas,
} from '../../lib/org.unit.types';
import { requireAuth } from '../../middleware/auth';
import zodToJsonSchema from 'zod-to-json-schema';

const r = Router();

r.get('/org-unit-types', (_req, res) => {
  res.json({ types: Object.keys(OrgUnitMetaSchemas) });
});

r.get('/org-unit-types/:type', requireAuth, (req, res) => {
  const type = req.params.type;
  const schema = getOrgUnitMetaSchema(type as any);
  if (!schema) return res.status(404).json({ error: 'Unknown org unit type' });

  // Convert Zod → JSON Schema
  // Convert Zod → JSON Schema
  const fullSchema: any = zodToJsonSchema(schema, `OrgUnitMeta_${type}`);

  // If it’s wrapped in a $ref + definitions, unwrap it
  let cleanSchema = fullSchema;
  if (fullSchema.$ref && fullSchema.definitions) {
    const refKey = fullSchema.$ref.replace('#/definitions/', '');
    cleanSchema = fullSchema.definitions?.[refKey] ?? fullSchema;
  }

  res.json({ type, schema: cleanSchema });
});

export default r;
