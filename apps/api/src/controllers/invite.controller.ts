// src/controllers/invites.controller.ts
import { z } from 'zod';

import {
  InviteBody,
  InviteListQuery,
  JoinCodeBody,
  InviteListResponse,
} from '../domain/invite.schema';

import {
  decodeCursor,
  encodeCursor,
  buildCursorWhere,
  stableOrder,
} from '../lib/pagination';

import { InvitesService } from '../services/invite.service';
import { asyncHandler, badRequest, HttpError } from '../lib/https';
import { Request, Response } from 'express';

export const InvitesController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const { id: orgId } = req.params;

    const p = InviteBody.safeParse(req.body);
    if (!p.success) {
      const e = badRequest('Invalid input');
      // expose zod issues as extra (your global error middleware can surface this)
      (e as HttpError & { extra?: any }).extra = p.error.flatten();
      throw e;
    }

    const { invite } = await InvitesService.createInvite({
      orgId,
      requesterEmail: req.user!.email!,
      ...p.data,
    });

    res.status(201).json(invite);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { id: orgId } = req.params;
    const q = InviteListQuery.safeParse(req.query);

    if (!q.success) {
      const e = badRequest('Invalid query');
      (e as HttpError & { extra?: any }).extra = q.error.flatten();
      throw e;
    }

    const {
      limit,
      cursor,
      q: term,
      role,
      status,
      unitId,
      sortKey: rawSortKey = 'createdAt',
      sortDir = 'desc',
    } = q.data;

    const sortKey = rawSortKey === 'unit' ? 'unitId' : rawSortKey;
    const cur = decodeCursor(cursor || null);

    const where: any = { orgId };
    if (role) where.role = role;
    if (unitId) where.unitId = unitId;
    if (status === 'pending') where.acceptedBy = null;
    if (status === 'accepted') where.acceptedBy = { not: null };
    if (term) where.email = { contains: term, mode: 'insensitive' };

    const cursorWhere = buildCursorWhere(cur, sortDir);

    const baseOrder = stableOrder(sortDir);
    const orderBy =
      sortKey && sortKey !== 'createdAt'
        ? ([{ [sortKey]: sortDir }, ...baseOrder] as any[])
        : (baseOrder as any[]);

    const rows = await InvitesService.listInvites({
      orgId,
      where: cursorWhere ? { AND: [where, cursorWhere] } : where,
      orderBy,
      limit,
    });

    const items = rows.slice(0, limit);
    const hasMore = rows.length > limit;
    const last = items[items.length - 1];
    const nextCursor =
      hasMore && last ? encodeCursor(last.createdAt, last.id) : null;

    const payload = {
      items: items.map((i: any) => ({
        ...i,
        createdAt: i.createdAt.toISOString(),
        expiresAt: i.expiresAt.toISOString(),
      })),
      nextCursor,
    };

    if (process.env.NODE_ENV !== 'production') {
      // runtime assert to catch schema drift in dev
      InviteListResponse.parse(payload);
    }

    res.json(payload);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const { inviteId } = req.params;
    if (!inviteId || typeof inviteId !== 'string') {
      throw badRequest('Invalid inviteId');
    }
    await InvitesService.deleteInvite(inviteId);
    res.sendStatus(204);
  }),

  acceptByJoinCode: asyncHandler(async (req: Request, res: Response) => {
    const p = JoinCodeBody.safeParse(req.body);
    if (!p.success) {
      const e = badRequest('Invalid body');
      (e as HttpError & { extra?: any }).extra = p.error.flatten();
      throw e;
    }

    const result = await InvitesService.acceptByJoinCode(
      req.user!,
      p.data.code
    );
    res.json({ message: 'Invite accepted via join code', ...result });
  }),

  acceptByToken: asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;
    if (!token || typeof token !== 'string') {
      throw badRequest('Invalid token');
    }
    const result = await InvitesService.acceptByToken(req.user!, token);
    res.json({ message: 'Invite accepted via link', ...result });
  }),
};
