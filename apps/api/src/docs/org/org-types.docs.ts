import { z } from 'zod';
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import {
  OrgTypesListResponse,
  UISchemaResponse,
} from '../../domain/org-types.schema';
  import { BasicError } from '../../domain/roles.schema';

export function getOrgTypePaths() {
  const registry = new OpenAPIRegistry();
  extendZodWithOpenApi(z);

  // GET /api/org-types
  registry.registerPath({
    method: 'get',
    path: '/api/org-types',
    summary: 'List all available organisation types.',
    tags: ['org-types'],
    responses: {
      200: {
        description: 'All organisation types.',
        content: { 'application/json': { schema: OrgTypesListResponse } },
      },
    },
  });

  // GET /api/org-types/{type}/schema
  registry.registerPath({
    method: 'get',
    path: '/api/org-types/{type}/schema',
    summary: 'Get UI-enhanced JSON schema for an organisation type',
    tags: ['org-types'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ type: z.string().openapi({ example: 'COLLEGE' }) }),
    },
    responses: {
      200: {
        description: 'Detailed UI schema with x-ui hints and groups',
        content: { 'application/json': { schema: UISchemaResponse } },
      },
      404: {
        description: 'Unknown organisation type',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/org-types/{type}/structure',
    summary:
      'Get the org-unit hierarchy structure for a given organisation type',
    tags: ['org-types'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        type: z.string().openapi({ example: 'SCHOOL' }),
      }),
    },
    responses: {
      200: {
        description: 'Hierarchy structure of org units for the given org type',
        content: {
          'application/json': {
            schema: z.object({
              orgType: z.string().openapi({ example: 'SCHOOL' }),
              hierarchy: z.record(z.string(), z.array(z.string())).openapi({
                example: {
                  ORGANISATION: ['DEPARTMENT', 'CLASS', 'GROUP', 'OTHER'],
                  CLASS: ['SECTION', 'SUBJECT', 'BATCH', 'GROUP', 'OTHER'],
                },
              }),
            }),
          },
        },
      },
      404: {
        description: 'Unknown or unsupported organisation type',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  const gen = new OpenApiGeneratorV3(registry.definitions);
  return gen.generateDocument({
    openapi: '3.0.0',
    info: { title: 'Organisation Types API', version: '1.0.0' },
  });
}
