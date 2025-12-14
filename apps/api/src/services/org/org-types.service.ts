import { OrgType } from '../../generated/prisma';

function toOrgType(raw: string): OrgType | null {
  const up = String(raw || '').toUpperCase();
  return (Object.values(OrgType) as string[]).includes(up)
    ? (up as OrgType)
    : null;
}

export const OrgTypesService = {
  listTypes() {
    return { types: Object.values(OrgType) };
  },

  getUiSchema(rawType: string) {
    const type = toOrgType(rawType);
    if (!type) return { type: rawType, uiVersion: 1, definition: {}, groups: [] };

    return {
      type,
      uiVersion: 1,
      definition: {},
      groups: [],
    };
  },
};
