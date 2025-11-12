import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';
import { OrgIdParam } from '../../domain/org.unit-types.schema';
import { UnitIdParam } from '../../domain/org.unit.schema';
import z from 'zod';

/* ---------------------------- Common Schemas ---------------------------- */

const AssignmentBase = z.object({
  title: z.string().describe('Assignment title'),
  body: z.string().nullable().optional().describe('Assignment details or description'),
  dueAt: z.string().datetime().nullable().optional().describe('Due date (ISO 8601 format)'),
});

const AssignmentResponse = AssignmentBase.extend({
  id: z.string(),
  orgId: z.string(),
  unitId: z.string(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const SubmissionResponse = z.object({
  id: z.string(),
  contentId: z.string(),
  studentId: z.string(),
  submittedAt: z.string().nullable(),
  grade: z.number().nullable(),
  feedback: z.string().nullable(),
  meta: z.record(z.any()).nullable(),
});

const SubmissionListResponse = z.object({
  items: z.array(SubmissionResponse),
  nextCursor: z.string().nullable(),
});

const AssignmentListResponse = z.object({
  items: z.array(AssignmentResponse),
  nextCursor: z.string().nullable(),
});

/* ---------------------------- Main Function ----------------------------- */

export function getOrgUnitAssignmentsPaths() {
  const registry = new OpenAPIRegistry();

  /* -------- GET: List Assignments -------- */
  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{orgId}/units/{unitId}/assignments',
    summary: 'List assignments for a specific unit',
    tags: ['assignments'],
    security: [{ bearerAuth: [] }],
    request: {
      params: UnitIdParam.merge(OrgIdParam),
      query: z.object({
        limit: z.string().optional().describe('Max items to return'),
        cursor: z.string().optional().describe('Pagination cursor'),
      }),
    },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: AssignmentListResponse } },
      },
    },
  });

  /* -------- POST: Create Assignment -------- */
  registry.registerPath({
    method: 'post',
    path: '/api/orgs/{orgId}/units/{unitId}/assignments',
    summary: 'Create a new assignment in a unit',
    tags: ['assignments'],
    security: [{ bearerAuth: [] }],
    request: {
      params: UnitIdParam.merge(OrgIdParam),
      body: {
        content: {
          'application/json': { schema: AssignmentBase },
        },
      },
    },
    responses: {
      201: {
        description: 'Assignment created',
        content: { 'application/json': { schema: AssignmentResponse } },
      },
    },
  });

  /* -------- GET: Assignment Details -------- */
  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{orgId}/units/{unitId}/assignments/{id}',
    summary: 'Get a specific assignment details with submissions',
    tags: ['assignments'],
    security: [{ bearerAuth: [] }],
    request: {
      params: UnitIdParam.merge(OrgIdParam).extend({
        id: z.string().describe('Assignment ID'),
      }),
    },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: AssignmentResponse } },
      },
    },
  });

  /* -------- PATCH: Update Assignment -------- */
  registry.registerPath({
    method: 'patch',
    path: '/api/orgs/{orgId}/units/{unitId}/assignments/{id}',
    summary: 'Update an existing assignment',
    tags: ['assignments'],
    security: [{ bearerAuth: [] }],
    request: {
      params: UnitIdParam.merge(OrgIdParam).extend({
        id: z.string(),
      }),
      body: {
        content: {
          'application/json': { schema: AssignmentBase.partial() },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated',
        content: { 'application/json': { schema: AssignmentResponse } },
      },
    },
  });

  /* -------- DELETE: Remove Assignment -------- */
  registry.registerPath({
    method: 'delete',
    path: '/api/orgs/{orgId}/units/{unitId}/assignments/{id}',
    summary: 'Delete an assignment',
    tags: ['assignments'],
    security: [{ bearerAuth: [] }],
    request: {
      params: UnitIdParam.merge(OrgIdParam).extend({
        id: z.string(),
      }),
    },
    responses: {
      204: { description: 'Deleted successfully' },
    },
  });

  /* -------- POST: Submit Assignment -------- */
  registry.registerPath({
    method: 'post',
    path: '/api/orgs/{orgId}/units/{unitId}/assignments/{id}/submissions',
    summary: 'Submit assignment work',
    tags: ['assignments'],
    security: [{ bearerAuth: [] }],
    request: {
      params: UnitIdParam.merge(OrgIdParam).extend({
        id: z.string().describe('Assignment ID'),
      }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              meta: z.record(z.any()).optional().describe('Submission metadata (e.g. file URLs, comments)'),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Submission recorded',
        content: { 'application/json': { schema: SubmissionResponse } },
      },
    },
  });

  /* -------- GET: List Submissions -------- */
  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{orgId}/units/{unitId}/assignments/{id}/submissions',
    summary: 'List all submissions for an assignment',
    tags: ['assignments'],
    security: [{ bearerAuth: [] }],
    request: {
      params: UnitIdParam.merge(OrgIdParam).extend({
        id: z.string().describe('Assignment ID'),
      }),
      query: z.object({
        limit: z.string().optional(),
        cursor: z.string().optional(),
      }),
    },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: SubmissionListResponse } },
      },
    },
  });

  /* -------- PATCH: Grade Submissions -------- */
  registry.registerPath({
    method: 'patch',
    path: '/api/orgs/{orgId}/units/{unitId}/assignments/{id}/grade',
    summary: 'Grade submissions for an assignment',
    tags: ['assignments'],
    security: [{ bearerAuth: [] }],
    request: {
      params: UnitIdParam.merge(OrgIdParam).extend({
        id: z.string(),
      }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              grades: z
                .array(
                  z.object({
                    submissionId: z.string(),
                    grade: z.number(),
                    feedback: z.string().nullable().optional(),
                    meta: z.record(z.any()).optional(),
                  })
                )
                .describe('Array of graded submissions'),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Grades applied successfully',
        content: { 'application/json': { schema: z.object({ ok: z.boolean(), count: z.number() }) } },
      },
    },
  });

  /* -------- Generate OpenAPI Document -------- */
  const gen = new OpenApiGeneratorV3(registry.definitions);
  return gen.generateDocument({
    openapi: '3.0.0',
    info: { title: 'Assignments API', version: '1.0.0' },
  });
}