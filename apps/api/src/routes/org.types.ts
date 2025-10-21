import { Router } from 'express';
import { OrgType } from '../generated/prisma';
import { getMetaSchema, MetaSchemas } from '../lib/org.types';
import zodToJsonSchema from 'zod-to-json-schema';
import { requireAuth } from '../middleware/auth';
import { UI_HINTS } from '../lib/org.unit';

const r = Router();

r.get('/org-types', (_req, res) => {
  res.json({ types: Object.values(OrgType) });
});

r.get('/org-types/:type', requireAuth, (req, res) => {
  const type = req.params.type as keyof typeof OrgType;
  const schema = getMetaSchema(type);
  if (!schema) return res.status(404).json({ error: 'Unknown org type' });

  const json = zodToJsonSchema(schema, { name: `OrgMeta_${type}` });
  res.json({ type, schema: json });
});

r.get('/org-types/:type/schema', requireAuth, (req, res) => {
  const type = String(req.params.type).toUpperCase() as OrgType;
  const zod = getMetaSchema(type);
  if (!zod) return res.status(404).json({ error: 'Unknown type' });

  // 1) Turn Zod into JSON schema
  const json = zodToJsonSchema(zod, { name: `OrgMeta_${type}` }) as any;

  // The object schema might be under "definitions.OrgMeta_TYPE"
  const defKey = `OrgMeta_${type}`;
  const def =
    json.definitions?.[defKey] ?? (json.title === defKey ? json : null);

  if (!def || !def.properties) {
    return res.status(500).json({ error: 'Schema transform failed' });
  }

  // 2) Attach x-ui hints per property
  const hints = UI_HINTS[type] || {};
  const groups: Record<string, { fields: string[]; order: number }> = {};

  Object.entries(def.properties).forEach(([prop, schema]: [string, any]) => {
    const ui = hints[prop] || {};
    if (Object.keys(ui).length) {
      schema['x-ui'] = ui;
    }

    // Build groups list for the client
    const g = ui.group || 'General';
    if (!groups[g]) groups[g] = { fields: [], order: ui.order ?? 999 };
    groups[g].fields.push(prop);
  });

  // 3) Respond
  return res.json({
    type,
    uiVersion: 1,
    definition: def, // the object schema with properties + required + x-ui
    groups: Object.entries(groups)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([name, v]) => ({ name, fields: v.fields })),
  });
});

export default r;
