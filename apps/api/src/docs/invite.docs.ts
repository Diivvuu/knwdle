// src/docs/invites.docs.ts
import { z } from 'zod';
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';

import {
  InviteBody,
  InviteListQuery,
  JoinCodeBody,
  InviteListResponse,
  InviteSchema,
  AcceptInviteResponse,
} from '../domain/invite.schema';
import {
  BulkInviteBody,
  BulkInviteDryRunResponse,
  BulkInviteKickoffResponse,
  BulkInviteStatusResponse,
  OrgBatchParams,
} from '../domain/bulk-invite.schema';
import { BasicError } from '../domain/roles.schema';
import { OrgIdParam } from '../domain/org.params';

export function getInviteOpenApiPaths() {
  const registry = new OpenAPIRegistry();

  registry.registerPath({
    method: 'post',
    path: '/api/orgs/{id}/invites',
    summary: 'Create an invite for an organisation',
    tags: ['invite'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string() }),
      body: { content: { 'application/json': { schema: InviteBody } } },
    },
    responses: {
      201: {
        description: 'Invite Created',
        content: { 'application/json': { schema: InviteSchema } },
      },
      400: {
        description: 'Invalid input',
        content: { 'application/json': { schema: BasicError } },
      },
      403: {
        description: 'Forbidden',
        content: { 'application/json': { schema: BasicError } },
      },
      409: {
        description: 'Conflict',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/invites',
    summary: 'List invites for an organisation (paginated)',
    tags: ['invite'],
    security: [{ bearerAuth: [] }],
    request: { params: z.object({ id: z.string() }), query: InviteListQuery },
    responses: {
      200: {
        description: 'Paginated list of invites',
        content: { 'application/json': { schema: InviteListResponse } },
      },
      400: {
        description: 'Invalid Query',
        content: { 'application/json': { schema: BasicError } },
      },
      403: {
        description: 'Forbidden',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/orgs/{orgId}/invites/{inviteId}',
    summary: 'Delete an invite',
    tags: ['invite'],
    security: [{ bearerAuth: [] }],
    request: { params: z.object({ orgId: z.string(), inviteId: z.string() }) },
    responses: {
      204: { description: 'Deleted' },
      403: {
        description: 'Forbidden',
        content: { 'application/json': { schema: BasicError } },
      },
      404: {
        description: 'Not Found',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/invites/{token}/accept',
    summary: 'Accept an invite using the email token',
    tags: ['invite'],
    security: [{ bearerAuth: [] }],
    request: { params: z.object({ token: z.string() }) },
    responses: {
      200: {
        description: 'Invite accepted',
        content: { 'application/json': { schema: AcceptInviteResponse } },
      },
      403: {
        description: 'Forbidden',
        content: { 'application/json': { schema: BasicError } },
      },
      404: {
        description: 'Invite not found',
        content: { 'application/json': { schema: BasicError } },
      },
      410: {
        description: 'Invite expired',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/invites/join-code',
    summary: 'Accept an invite using a join code',
    tags: ['invite'],
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { 'application/json': { schema: JoinCodeBody } } },
    },
    responses: {
      200: {
        description: 'Invite accepted via join code',
        content: { 'application/json': { schema: AcceptInviteResponse } },
      },
      400: {
        description: 'Invalid body',
        content: { 'application/json': { schema: BasicError } },
      },
      403: {
        description: 'Code not found / forbidden',
        content: { 'application/json': { schema: BasicError } },
      },
      410: {
        description: 'Invite expired',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  // bulk
  registry.registerPath({
    method: 'post',
    path: '/api/orgs/{id}/invites/bulk',
    summary: 'Create bulk invites',
    tags: ['invites'],
    security: [{ bearerAuth: [] }],
    request: {
      params: OrgIdParam,
      body: { content: { 'application/json': { schema: BulkInviteBody } } },
    },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.union([
              BulkInviteDryRunResponse,
              BulkInviteKickoffResponse,
            ]),
          },
        },
      },
      400: {
        description: 'Invalid input',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  // SSE stream: live bulk-invite progress
  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/invites/bulk/{batchId}/stream',
    summary: 'SSE stream for bulk invite progress',
    description:
      'Server-Sent Events stream. Emits `progress` and `done/error` events with payloads like `{ total, sent, failed, skipped }`.',
    tags: ['invites'],
    security: [{ bearerAuth: [] }],
    request: { params: OrgBatchParams },
    responses: {
      200: {
        description: 'Event stream (text/event-stream)',
        content: {
          'text/event-stream': {
            schema: z.string().openapi('SSEStream'),
            example:
              'event: progress\\n' +
              'data: {"total":50,"sent":10,"failed":0,"skipped":1}\\n\\n',
          },
        },
      },
      401: {
        description: 'Forbidden',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/invites/bulk/{batchId}/status',
    summary: 'Bulk invite batch status',
    tags: ['invites'],
    security: [{ bearerAuth: [] }],
    request: { params: OrgBatchParams },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: BulkInviteStatusResponse } },
      },
      404: {
        description: 'Not found',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: { title: 'Invite API', version: '1.0.0' },
  });
}
