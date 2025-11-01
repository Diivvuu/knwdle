import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';

import z from 'zod';
import {
  OrgConnectHero,
  OrgConnectSummary,
} from '../domain/org.connect-dashboard.schema';

export function getOrgConnectDashboardPaths() {
  const registry = new OpenAPIRegistry();
  const OrgIdParam = z.object({ id: z.string().describe('Organisation ID') });

  const secured = [{ bearerAuth: [] }];

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/connect-dashboard/hero',
    summary: 'Get organisation + enrolled unit info for student/parent',
    tags: ['connect-dashboard'],
    security: secured,
    request: { params: OrgIdParam },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: OrgConnectHero } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/connect-dashboard/summary',
    summary: 'Get student dashboard summary (attendance, fees, etc.)',
    tags: ['connect-dashboard'],
    security: secured,
    request: { params: OrgIdParam },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: OrgConnectSummary } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/connect-dashboard/timetable-today',
    summary: 'Get today’s timetable for student/teacher',
    tags: ['connect-dashboard'],
    security: secured,
    request: { params: OrgIdParam },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: z.any() } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/connect-dashboard/announcements-peek',
    summary: 'Get recent announcements for student/parent',
    tags: ['connect-dashboard'],
    security: secured,
    request: { params: OrgIdParam },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: z.any() } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/connect-dashboard/config',
    summary: 'Get widget config for Connect dashboard',
    tags: ['connect-dashboard'],
    security: secured,
    request: { params: OrgIdParam },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.object({
              role: z.string(),
              widgets: z.array(z.string()),
              tables: z.array(z.string()),
            }),
          },
        },
      },
    },
  });

  const gen = new OpenApiGeneratorV3(registry.definitions);
  return gen.generateDocument({
    openapi: '3.0.0',
    info: { title: 'Org Connect Dashboard API', version: '1.0.0' },
  });
}
