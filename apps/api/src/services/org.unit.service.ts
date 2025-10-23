import { OrgUnit, OrgUnitType } from '../generated/prisma';
import { badRequest, HttpError, notFound } from '../lib/https';
import {
  buildCursorWhere,
  decodeCursor,
  encodeCursor,
  stableOrder,
} from '../lib/pagination';
import { OrgUnitRepo } from '../repositories/org.unit.repo';
import { prisma } from '../lib/prisma';
import { encode } from 'punycode';

function buildPath(
  parentPath?: string | null,
  parentId?: string | null
): string {
  if (!parentId) return '';
  return parentPath ? `${parentPath}/${parentId}` : parentId;
}

async function assertSameOrgParent(
  orgId: string,
  parentId: string | null | undefined
) {
  if (!parentId) return { parentPath: null as string | null };
  const parent = await OrgUnitRepo.getParent(orgId, parentId);
  if (!parent) throw badRequest('Parent does not exist in this organisation');
  return { parentPath: parent.path ?? '' };
}

export const OrgUnitService = {
  async create(
    orgId: string,
    body: {
      name: string;
      code?: string | null;
      parentId?: string | null;
      type: OrgUnitType;
      meta?: any;
    }
  ) {
    const { parentPath } = await assertSameOrgParent(
      orgId,
      body.parentId ?? null
    );

    const partialPath = buildPath(parentPath, body.parentId ?? null);

    const created = await OrgUnitRepo.create({
      orgId,
      parentId: body.parentId,
      name: body.name,
      code: body.code ?? null,
      type: body.type,
      meta: body.meta,
      path: partialPath,
    });

    const finalPath = partialPath ? `${partialPath}/${created.id}` : created.id;
    await OrgUnitRepo.update(created.id, { path: finalPath });

    return { ...created, path: finalPath };
  },

  async get(orgId: string, unitId: string) {
    const u = await OrgUnitRepo.get(orgId, unitId);
    if (!u) throw notFound('Unit not found');
    return u;
  },

  async list(
    orgId: string,
    query: {
      parentId?: string | null;
      limit: number;
      cursor?: string;
      sortDir: 'asc' | 'desc';
    }
  ) {
    const cur = decodeCursor(query.cursor ?? null);
    const where: any = { orgId, parentId: query.parentId ?? null };
    const orderBase = stableOrder(query.sortDir);
    const rows = await OrgUnitRepo.listChildren(
      cur ? { AND: [where, buildCursorWhere(cur, query.sortDir)!] } : where,
      orderBase,
      query.limit + 1
    );

    const items = rows.slice(0, query.limit);
    const hasMore = rows.length > query.limit;
    const last = items[items.length - 1];

    return {
      items,
      nextCursor:
        hasMore && last ? encodeCursor(last.createdAt as any, last.id) : null,
    };
  },

  async update(
    orgId: string,
    unitId: string,
    body: {
      name?: string;
      code?: string | null;
      type?: OrgUnitType;
      meta?: any;
      parentId?: string | null;
    }
  ) {
    const existing = await OrgUnitRepo.get(orgId, unitId);
    if (!existing) throw notFound('Unit not found');

    let newPath = existing.path;
    let newParentId = existing.parentId ?? null;

    //move?
    if (body.parentId !== undefined) {
      const targetParentId = body.parentId;
      if (targetParentId === existing.id)
        throw badRequest('A unit cannot be its own parent');

      //ensure parent is in same org
      const { parentPath } = await assertSameOrgParent(
        orgId,
        targetParentId ?? null
      );

      //prevent cycles : moving under a descendant would include our own id in parent path
      if (targetParentId && existing.path.split('/').includes(targetParentId)) {
        throw badRequest('Cannot move a unit under its descendant');
      }

      const parentPathStr = buildPath(parentPath, targetParentId ?? null);
      newParentId = targetParentId ?? null;
      newPath = parentPathStr ? `${parentPathStr}/${existing.id}` : existing.id;
    }
    const updated = await OrgUnitRepo.update(unitId, {
      name: body.name,
      code: body.code ?? (body.code === null ? null : undefined),
      type: body.type,
      meta: body.meta,
      parentId: newParentId,
      path: newPath,
    });

    //if parent changed rewrite path for descendants
    if (body.parentId !== undefined && updated) {
      const oldPrefix = existing.path;
      const newPrefix = newPath;

      const descendants = await prisma.orgUnit.findMany({
        where: { orgId, path: { startsWith: `${oldPrefix}/` } },
        select: { id: true, path: true },
      });

      for (const d of descendants) {
        const tail = d.path.substring(oldPrefix.length);
        await OrgUnitRepo.update(d.id, { path: `${newPrefix}${tail}` });
      }
    }
    return updated;
  },

  async remove(orgId: string, unitId: string, force = false) {
    const existing = await OrgUnitRepo.get(orgId, unitId);
    if (!existing) throw notFound('Unit not found');

    const hasKids = await OrgUnitRepo.hasChildren(unitId);
    if (hasKids && !force) {
      const e = new HttpError(409, 'Unit has child units');
      //@ts-expect-error
      e.extra = {
        hint: 'Pass ?force=true to delete with descendants or move children first.',
      };
      throw e;
    }

    await OrgUnitRepo.remove(unitId);
  },
  async search(
    orgId: string,
    query: {
      q: string;
      limit: number;
      cursor?: string;
      sortDir: 'asc' | 'desc';
    }
  ) {
    const cur = decodeCursor(query.cursor ?? null);
    const orderBy = stableOrder(query.sortDir);
    const rows = await OrgUnitRepo.search(
      orgId,
      query.q,
      orderBy,
      query.limit + 1,
      cur ? buildCursorWhere(cur, query.sortDir) : undefined
    );

    const items = rows.slice(0, query.limit);
    const hasMore = rows.length > query.limit;
    const last = items[items.length - 1];

    return {
      items,
      nextCursor:
        hasMore && last ? encodeCursor(last.createdAt as any, last.id) : null,
    };
  },
};
