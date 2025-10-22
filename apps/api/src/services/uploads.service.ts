import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { createUploadPost, createGetObjectUrl } from '../lib/s3';
import { env } from '../lib/env';
import { badRequest, forbidden } from '../lib/https';

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

export const UploadsService = {
  async presignUpload(
    userId: string,
    body: { filename: string; contentType: string; orgId?: string }
  ) {
    const { filename, contentType, orgId } = body;

    if (orgId) {
      const membership = await prisma.orgMembership.findFirst({
        where: { orgId, userId },
        select: { id: true },
      });
      if (!membership) throw forbidden('Not a member of the organization');
    }

    const prefix = orgId ? `orgs/${orgId}` : `users/${userId}`;
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

    return { url, fields, key } as const;
  },

  async presignGet(userId: string, key: string) {
    // Enforce allowed roots early.
    if (!isUserKey(key, userId)) {
      const orgId = getOrgIdFromKey(key);
      if (!orgId) throw badRequest('Invalid key prefix');

      const membership = await prisma.orgMembership.findFirst({
        where: { orgId, userId },
        select: { id: true },
      });
      if (!membership) throw forbidden('Forbidden');
    }

    const expiresInSec = 60;
    const url = await createGetObjectUrl({ key, expiresInSec });
    return { url, expiresIn: expiresInSec } as const;
  },
};
