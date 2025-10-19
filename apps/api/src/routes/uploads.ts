// src/routes/uploads.ts
// Private bucket uploads. View/download must go through backend which issues short‑lived GET presigns.

import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { createUploadPost, createGetObjectUrl } from '../lib/s3';
import { env } from '../lib/env';
import { prisma } from '../lib/prisma';
import { randomUUID } from 'crypto';

const r = Router();

const Body = z.object({
  filename: z.string().min(1),
  contentType: z
    .string()
    .regex(/^image\/(png|jpe?g|webp|svg\+xml)$/i, 'Only images allowed'),
  orgId: z.string().min(1).optional(),
});

const GetBody = z.object({
  key: z.string().min(1),
});

function sanitizeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '');
}

function isUserKey(key: string, userId: string) {
  return key.startsWith(`users/${userId}/`);
}
function getOrgIdFromKey(key: string): string | null {
  const m = key.match(/^orgs\/([^/]+)\//);
  return m ? m[1] : null;
}

r.post('/uploads/presign', requireAuth, async (req, res) => {
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Invalid input', details: parsed.error.flatten() });
  }
  const { filename, contentType, orgId } = parsed.data;

  if (orgId) {
    const membership = await prisma.orgMembership.findFirst({
      where: { orgId, userId: req.user!.id },
      select: { id: true },
    });
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of the organization' });
    }
  }

  try {
    const prefix = orgId ? `orgs/${orgId}` : `users/${req.user!.id}`; // only these two roots allowed
    const sanitized = sanitizeFileName(filename);
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const key = `${prefix}/uploads/${year}/${month}/${randomUUID()}-${sanitized}`;

    const { url, fields } = await createUploadPost({
      key,
      contentType,
      maxBytes: env.MAX_UPLOAD_MB * 1024 * 1024,
    });

    return res.json({ url, fields, key });
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: 'Failed to create presigned upload', detail: e?.message });
  }
});

/**
 * Issue a short-lived GET URL to read a private object.
 * Authorization rules:
 * - keys under `users/{userId}/...` can only be read by that same user.
 * - keys under `orgs/{orgId}/...` require membership in that org.
 */
r.post('/uploads/presign-get', requireAuth, async (req, res) => {
  const parsed = GetBody.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const { key } = parsed.data;
  const userId = req.user!.id;

  // Enforce allowed key roots early.
  if (!isUserKey(key, userId)) {
    const orgId = getOrgIdFromKey(key);
    if (!orgId) {
      return res.status(400).json({ error: 'Invalid key prefix' });
    }
    // Must be member of the org
    const membership = await prisma.orgMembership.findFirst({
      where: { orgId, userId },
      select: { id: true },
    });
    if (!membership) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  try {
    const url = await createGetObjectUrl({ key, expiresInSec: 60 });
    return res.json({ url, expiresIn: 60 });
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: 'Failed to create presigned GET url', detail: e?.message });
  }
});

export default r;
