import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';
import z from 'zod';
import { UnitDashParams, UnitDashQuery } from '../domain/org.unit.dashboard.schema';

export function getOrgUnitDashboardPaths() {
  const registry = new OpenAPIRegistry();

  /* --------------------------- Dashboard Config --------------------------- */
  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{orgId}/units/{unitId}/dashboard/config',
    summary: 'Get dashboard configuration for the unit',
    description:
      'Returns available widgets, tables, and permissions for the current user in this unit.',
    tags: ['org-unit-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: UnitDashParams },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.object({
              role: z.string(),
              orgType: z.string(),
              features: z.array(z.string()),
              widgets: z.array(z.string()),
              tables: z.array(z.string()),
            }),
          },
        },
      },
    },
  });

  /* ------------------------------- Hero Info ------------------------------ */
  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{orgId}/units/{unitId}/dashboard/hero',
    summary: 'Get hero stats for the unit',
    description:
      'Returns quick overview of the unit — name, type, member count, and metadata summary.',
    tags: ['org-unit-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: UnitDashParams },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.object({
              id: z.string(),
              name: z.string(),
              type: z.string(),
              meta: z.any(),
              _count: z.object({ members: z.number() }),
            }),
          },
        },
      },
    },
  });

  /* ------------------------------- Summary -------------------------------- */
  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{orgId}/units/{unitId}/dashboard/summary',
    summary: 'Get academic summary for the unit',
    description:
      'Aggregated stats for attendance, assignments, tests, and results over selected range.',
    tags: ['org-unit-dashboard'],
    security: [{ bearerAuth: [] }],
    request: {
      params: UnitDashParams,
      query: UnitDashQuery,
    },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.object({
              attendance: z.object({
                totalSessions: z.number(),
                avgRate: z.number(),
                lastSessionAt: z.string().nullable(),
              }),
              results: z.object({ count: z.number() }),
              assignments: z.object({ count: z.number() }),
              tests: z.object({ count: z.number() }),
            }),
          },
        },
      },
    },
  });

  /* ---------------------------- Widgets / Peeks --------------------------- */
  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{orgId}/units/{unitId}/dashboard/timetable-today',
    summary: 'Get today’s timetable for the unit',
    tags: ['org-unit-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: UnitDashParams },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.array(
              z.object({
                id: z.string(),
                startTime: z.string(),
                endTime: z.string(),
                room: z.string().nullable(),
                mode: z.string().nullable(),
                subject: z.object({ id: z.string(), name: z.string() }).nullable(),
                teacher: z.object({ id: z.string(), name: z.string() }).nullable(),
              })
            ),
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{orgId}/units/{unitId}/dashboard/announcements-peek',
    summary: 'Get recent announcements for the unit',
    tags: ['org-unit-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: UnitDashParams },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.array(
              z.object({
                id: z.string(),
                title: z.string(),
                body: z.string().nullable(),
                createdAt: z.string(),
              })
            ),
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{orgId}/units/{unitId}/dashboard/assignments-due',
    summary: 'Get upcoming assignments',
    tags: ['org-unit-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: UnitDashParams },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.array(
              z.object({
                id: z.string(),
                title: z.string(),
                dueAt: z.string(),
              })
            ),
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{orgId}/units/{unitId}/dashboard/tests-due',
    summary: 'Get upcoming tests',
    tags: ['org-unit-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: UnitDashParams },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.array(
              z.object({
                id: z.string(),
                title: z.string(),
                dueAt: z.string(),
              })
            ),
          },
        },
      },
    },
  });

  /* ------------------------------ Snapshots ------------------------------- */
  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{orgId}/units/{unitId}/dashboard/attendance-summary',
    summary: 'Get 30-day attendance snapshot',
    tags: ['org-unit-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: UnitDashParams },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.object({
              totalSessions: z.number(),
              avgRate: z.number(),
              lastSessionAt: z.string().nullable(),
            }),
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{orgId}/units/{unitId}/dashboard/results-summary',
    summary: 'Get results summary snapshot',
    tags: ['org-unit-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: UnitDashParams },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.object({ totalResults: z.number() }),
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{orgId}/units/{unitId}/dashboard/fees-snapshot',
    summary: 'Get financial snapshot for the unit',
    tags: ['org-unit-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: UnitDashParams },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.object({
              totalPaid: z.number(),
              totalDue: z.number(),
              overdueCount: z.number(),
            }),
          },
        },
      },
    },
  });

  /* ---------------------------- Generator ---------------------------- */
  const gen = new OpenApiGeneratorV3(registry.definitions);
  return gen.generateDocument({
    openapi: '3.0.0',
    info: { title: 'Org Unit Dashboard API', version: '1.0.0' },
  });
}