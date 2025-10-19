// src/lib/s3.ts
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env, isProd } from './env';
import crypto from 'node:crypto';

/**
 * Single S3 client. Credentials are picked up from env:
 * AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
 */
export const s3 = new S3Client({
  region: env.AWS_REGION,
});

/**
 * Legacy helper for generating a key. Our router currently constructs keys
 * as either:
 *   - users/{userId}/uploads/YYYY/MM/{uuid}-{sanitizedName}
 *   - orgs/{orgId}/uploads/YYYY/MM/{uuid}-{sanitizedName}
 * You can still use this as needed for misc flows.
 */
export function makeObjectKey(opts: {
  userId: string;
  kind: 'org-logo' | 'org-cover' | 'misc';
  originalName?: string; // to preserve extension
}) {
  const date = new Date();
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const ext = (opts.originalName?.split('.').pop() || 'bin').toLowerCase();
  const rand = crypto.randomUUID();
  return `${isProd ? 'prod' : 'dev'}/${opts.userId}/${opts.kind}/${y}/${m}/${d}/${rand}.${ext}`;
}

/**
 * Create a presigned POST for browser direct-upload.
 * Bucket is private; we do not return a public URL. Reads should go via
 * a short-lived GET presign (createGetObjectUrl()).
 */
export async function createUploadPost(params: {
  key: string;
  contentType: string;
  maxBytes: number; // bytes
  expiresSec?: number; // default 300s
}) {
  const { url, fields } = await createPresignedPost(s3, {
    Bucket: env.S3_BUCKET,
    Key: params.key,
    Expires: params.expiresSec ?? 300,
    Fields: {
      'Content-Type': params.contentType,
    },
    Conditions: [
      ['content-length-range', 0, params.maxBytes],
      ['eq', '$Content-Type', params.contentType],
      // If you ever require SSE on objects, uncomment the next two lines and
      // also set the field in the upload form:
      // { 'x-amz-server-side-encryption': 'AES256' },
      // ['eq', '$x-amz-server-side-encryption', 'AES256'],
    ],
  });

  return { url, fields, key: params.key };
}

/**
 * Create a short-lived presigned GET URL to read a private object.
 * Use this when returning a view URL to the client after authZ checks.
 */
export async function createGetObjectUrl(params: {
  key: string;
  expiresInSec?: number; // default 60s
}) {
  const cmd = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: params.key,
  });
  const url = await getSignedUrl(s3, cmd, {
    expiresIn: params.expiresInSec ?? 60,
  });
  return url;
}

/** Optional: utility if you still need a deterministic public URL for CDN-style access. */
export function buildObjectUrl(key: string) {
  if (env.S3_PUBLIC_BASE_URL) return `${env.S3_PUBLIC_BASE_URL}/${key}`;
  // Fall back to regional endpoint
  return `https://${env.S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}
