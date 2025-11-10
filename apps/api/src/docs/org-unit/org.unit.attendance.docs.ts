// src/openapi/org.unit.attendance.openapi.ts
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';
import z from 'zod';
import { OrgIdParam } from '../../domain/org.unit-types.schema';
import { UnitIdParam } from '../../domain/org.unit.schema';

/* ---------- Schemas ---------- */
const AttendanceRecordSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  studentId: z.string(),
  status: z.string(),
  meta: z.record(z.any()).optional(),
  createdAt: z.string(),
});

const AttendanceSessionSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  unitId: z.string(),
  date: z.string(),
  period: z.string().nullable(),
  takenById: z.string().nullable(),
  notes: z.string().nullable(),
  timeTableEntryId: z.string().nullable(),
  createdAt: z.string(),
  records: z.array(AttendanceRecordSchema).optional(),
});

const AttendanceListResponse = z.array(AttendanceSessionSchema);

const CreateSessionBody = z.object({
  date: z.string().optional(),
  period: z.string().optional(),
  notes: z.string().optional(),
});

const AttendanceRecordsBody = z.object({
  records: z.array(
    z.object({
      studentId: z.string(),
      status: z.string(),
      meta: z.record(z.any()).optional(),
    })
  ),
});

/* ---------- Paths ---------- */
export function getOrgUnitAttendancePaths() {
  const registry = new OpenAPIRegistry();

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{orgId}/units/{unitId}/attendance/sessions',
    summary: 'List attendance sessions for a unit',
    tags: ['attendance'],
    security: [{ bearerAuth: [] }],
    request: { params: OrgIdParam.merge(UnitIdParam) },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: AttendanceListResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/orgs/{orgId}/units/{unitId}/attendance/sessions',
    summary: 'Create a new attendance session',
    tags: ['attendance'],
    security: [{ bearerAuth: [] }],
    request: {
      params: OrgIdParam.merge(UnitIdParam),
      body: { content: { 'application/json': { schema: CreateSessionBody } } },
    },
    responses: {
      201: {
        description: 'Created',
        content: { 'application/json': { schema: AttendanceSessionSchema } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/orgs/{orgId}/units/{unitId}/attendance/sessions/{sessionId}/records',
    summary: 'Upsert attendance records for a session',
    tags: ['attendance'],
    security: [{ bearerAuth: [] }],
    request: {
      params: OrgIdParam.merge(UnitIdParam).extend({
        sessionId: z.string().describe('Session ID'),
      }),
      body: {
        content: { 'application/json': { schema: AttendanceRecordsBody } },
      },
    },
    responses: {
      200: {
        description: 'Records updated',
        content: {
          'application/json': {
            schema: z.object({ ok: z.boolean(), count: z.number() }),
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{orgId}/units/{unitId}/attendance/sessions/{sessionId}',
    summary: 'Get attendance session details',
    tags: ['attendance'],
    security: [{ bearerAuth: [] }],
    request: {
      params: OrgIdParam.merge(UnitIdParam).extend({
        sessionId: z.string(),
      }),
    },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: AttendanceSessionSchema } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{orgId}/units/{unitId}/attendance/self',
    summary: 'Get self attendance records for logged-in student',
    tags: ['attendance'],
    security: [{ bearerAuth: [] }],
    request: { params: OrgIdParam.merge(UnitIdParam) },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: z.array(AttendanceRecordSchema),
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{orgId}/attendance/summary',
    summary: 'Get attendance summary',
    tags: ['attendance'],
    security: [{ bearerAuth: [] }],
    request: {
      params: OrgIdParam,
      query: z.object({
        unitId: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
      }),
    },
    responses: {
      200: {
        description: 'Attendance summary analytics',
        content: {
          'application/json': {
            schema: z.object({
              totalSessions: z.number(),
              totalRecords: z.number(),
              totalPresent: z.number(),
              attendanceRate: z.number(),
              from: z.string(),
              to: z.string(),
            }),
          },
        },
      },
    },
  });

  const gen = new OpenApiGeneratorV3(registry.definitions);
  return gen.generateDocument({
    openapi: '3.0.0',
    info: { title: 'Org Unit Attendance API', version: '1.0.0' },
  });
}
