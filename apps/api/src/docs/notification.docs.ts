// src/openapi/notifications.openapi.ts
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import z from 'zod';

/* ---------- Schemas ---------- */
const NotificationSchema = z.object({
  id: z.string(),
  orgId: z.string().nullable(),
  userId: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  meta: z.record(z.any()).optional(),
  read: z.boolean(),
  createdAt: z.string(),
});

const NotificationListResponse = z.array(NotificationSchema);

const NotificationReadParam = z.object({
  id: z.string().describe('Notification ID'),
});

/* ---------- Paths ---------- */
export function getNotificationsPaths() {
  const registry = new OpenAPIRegistry();

  registry.registerPath({
    method: 'get',
    path: '/api/notifications',
    summary: 'List notifications for the authenticated user',
    tags: ['notifications'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'List of notifications',
        content: { 'application/json': { schema: NotificationListResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/notifications/{id}/read',
    summary: 'Mark a notification as read',
    tags: ['notifications'],
    security: [{ bearerAuth: [] }],
    request: { params: NotificationReadParam },
    responses: {
      200: {
        description: 'Notification marked as read',
        content: {
          'application/json': {
            schema: z.object({ ok: z.boolean() }),
          },
        },
      },
    },
  });

  const gen = new OpenApiGeneratorV3(registry.definitions);
  return gen.generateDocument({
    openapi: '3.0.0',
    info: { title: 'Notifications API', version: '1.0.0' },
  });
}