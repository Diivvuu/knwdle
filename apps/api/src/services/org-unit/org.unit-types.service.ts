import zodToJsonSchema from 'zod-to-json-schema';
import { OrgUnitType } from '../../generated/prisma';
import {
  ALLOWED_CHILDREN,
  computeAllowedChildren,
  FEATURE_DEFAULTS,
} from '../../lib/org.unit.rules';
import { badRequest, notFound } from '../../lib/https';
import {
  OrgUnitTypesListResponseT,
  OrgUnitUISchemaResponseT,
  AllowedChildrenResponseT,
} from '../../domain/org.unit-types.schema';
import { getUnitMetaSchema } from '../../lib/org.unit.type.meta';
import { UNIT_UI_HINTS } from '../../lib/org.unit.type.ui';
import { OrgRepo } from '../../repositories/org/org.repo';

function toUnitType(raw: string): OrgUnitType | null {
  const up = String(raw || '').toUpperCase();
  return (Object.values(OrgUnitType) as string[]).includes(up)
    ? (up as OrgUnitType)
    : null;
}

export const OrgUnitTypesService = {
  async list(orgId: string): Promise<OrgUnitTypesListResponseT> {
    const orgRecord = await OrgRepo.getOrgTypeById(orgId);
    if (!orgRecord) throw notFound('Organisation not found');
    const orgType = orgRecord.type;

    const set = new Set<OrgUnitType>();
    const map = ALLOWED_CHILDREN[orgType] ?? {};
    for (const arr of Object.values(map)) (arr || []).forEach((t) => set.add(t));

    return {
      orgType,
      types: Array.from(set),
      featureDefaults: FEATURE_DEFAULTS[orgType] ?? {},
    };
  },

  async getUiSchema(
    orgId: string,
    rawType: string
  ): Promise<OrgUnitUISchemaResponseT> {
    const unitType = toUnitType(rawType);
    if (!unitType) throw badRequest('Invalid unit type');

    const orgRecord = await OrgRepo.getOrgTypeById(orgId);
    if (!orgRecord) throw notFound('Organisation not found');
    const orgType = orgRecord.type;

    const zod = getUnitMetaSchema(unitType);
    const json: any = zodToJsonSchema(zod, { name: `OrgUnitMeta_${unitType}` });

    const defKey = `OrgUnitMeta_${unitType}`;
    const def =
      json.definitions?.[defKey] ?? (json.title === defKey ? json : null);
    if (!def || !def.properties) throw badRequest('Schema transform failed');

    const hints = UNIT_UI_HINTS[unitType] ?? {};
    const groups: Record<string, { fields: string[]; order: number }> = {};

    Object.entries(def.properties).forEach(([prop, schema]: [string, any]) => {
      const ui = hints[prop] || {};
      if (Object.keys(ui).length) schema['x-ui'] = ui;

      const g = ui.group || 'General';
      if (!groups[g]) groups[g] = { fields: [], order: ui.order ?? 999 };
      groups[g].fields.push(prop);
    });

    return {
      orgType,
      unitType,
      uiVersion: 1,
      definition: def,
      groups: Object.entries(groups)
        .sort((a, b) => a[1].order - b[1].order)
        .map(([name, v]) => ({ name, fields: v.fields })),
    };
  },

  async getFeatures(orgId: string, type: OrgUnitType) {
    const orgRecord = await OrgRepo.getOrgTypeById(orgId);
    if (!orgRecord) throw notFound('Organisation not found');
    const orgType = orgRecord.type;
    const features = (FEATURE_DEFAULTS[orgType] ?? {})[type] ?? {};
    return { orgType, unitType: type, features };
  },

  async allowed(
    orgId: string,
    parentType: OrgUnitType | null
  ): Promise<AllowedChildrenResponseT> {
    const orgRecord = await OrgRepo.getOrgTypeById(orgId);
    if (!orgRecord) throw notFound('Organisation not found');
    const orgType = orgRecord.type;
    const allowed = computeAllowedChildren(orgType, parentType);
    return { orgType, parentType, allowed };
  },
};