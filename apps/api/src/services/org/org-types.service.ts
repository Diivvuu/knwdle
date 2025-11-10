import zodToJsonSchema from 'zod-to-json-schema';
import { OrgType, OrgUnitType } from '../../generated/prisma';
import { getMetaSchema } from '../../lib/org.type.meta';
import { badRequest, notFound } from '../../lib/https';
import { UI_HINTS } from '../../lib/org.type.ui';
import { ALLOWED_CHILDREN } from '../../lib/org.unit.rules';

function toOrgType(raw: string): OrgType | null {
  const up = String(raw || '').toUpperCase();
  return (Object.values(OrgType) as string[]).includes(up)
    ? (up as OrgType)
    : null;
}

/** Build the UI-enhanced JSON schema + field groups */
export const OrgTypesService = {
  listTypes() {
    return { types: Object.values(OrgType) };
  },

  getUiSchema(rawType: string) {
    const type = toOrgType(rawType);
    if (!type) throw notFound('Unknown type');

    const zod = getMetaSchema(type);
    if (!zod) throw notFound('Unknown type');

    // 1) Zod -> JSON Schema
    const json: any = zodToJsonSchema(zod, { name: `OrgMeta_${type}` });

    // Resolve the object schema that has properties
    const defKey = `OrgMeta_${type}`;
    const def =
      json.definitions?.[defKey] ?? (json.title === defKey ? json : null);

    if (!def || !def.properties) {
      throw badRequest('Schema transform failed');
    }

    // 2) Attach x-ui hints + build groups
    const hints = (UI_HINTS as any)[type] || {};
    const groups: Record<string, { fields: string[]; order: number }> = {};

    Object.entries(def.properties).forEach(([prop, schema]: [string, any]) => {
      const ui = hints[prop] || {};
      if (Object.keys(ui).length) schema['x-ui'] = ui;

      const g = ui.group || 'General';
      if (!groups[g]) groups[g] = { fields: [], order: ui.order ?? 999 };
      groups[g].fields.push(prop);
    });

    return {
      type,
      uiVersion: 1,
      definition: def,
      groups: Object.entries(groups)
        .sort((a, b) => a[1].order - b[1].order)
        .map(([name, v]) => ({ name, fields: v.fields })),
    };
  },

  getUnitStructure(rawType: string) {
    const type = toOrgType(rawType);
    if (!type) throw notFound('Unknwon type');

    const hierarchy = ALLOWED_CHILDREN[type];
    if (!hierarchy) throw notFound('No hierarchy defined for this org type');

    return {
      orgType: type,
      hierarchy,
    };
  },
};
