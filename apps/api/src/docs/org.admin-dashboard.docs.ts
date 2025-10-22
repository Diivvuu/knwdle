import { z } from 'zod';
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';
import {
  IdParam,
  ActivityQuery,
  BasicError,
} from '../domain/org.admin-dashboard.schema';

export function getOrgAdminDashboardPaths() {
  const registry = new OpenAPIRegistry();

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{id}',
    summary: 'Org Dashboard hero card (org + aggregates + signed image URLs)',
    tags: ['admin-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: IdParam },
    responses: {
      200: {
        description: 'Org hero payload',
        content: { 'application/json': { schema: z.any() } },
      },
      400: {
        description: 'Bad org id',
        content: { 'application/json': { schema: BasicError } },
      },
      404: {
        description: 'Org not found',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/summary',
    summary:
      'Lightweight org summary {counts, pending invites, last join time}',
    tags: ['admin-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: IdParam },
    responses: {
      200: {
        description: 'Summary',
        content: { 'application/json': { schema: z.any() } },
      },
      400: {
        description: 'Bad org id',
        content: { 'application/json': { schema: BasicError } },
      },
      404: {
        description: 'Org not found',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/activity',
    summary: 'Org activity feed (cursor-paginated audit log)',
    tags: ['admin-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: IdParam, query: ActivityQuery },
    responses: {
      200: {
        description: 'Activity Page',
        content: { 'application/json': { schema: z.any() } },
      },
      400: {
        description: 'Invalid query/bad org id',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/dashboard-config',
    summary: 'Server-driven dashboard visibility (widgets, tables, caps)',
    tags: ['admin-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: IdParam },
    responses: {
      200: {
        description: 'Dashboard config',
        content: { 'application/json': { schema: z.any() } },
      },
      403: {
        description: 'Forbidden',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  const gen = new OpenApiGeneratorV3(registry.definitions);
  return gen.generateDocument({
    openapi: '3.0.0',
    info: { title: 'Admin Dashboard API', version: '1.0.0' },
  });
}
