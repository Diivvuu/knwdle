import { z } from 'zod';
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';

import {
  CreateAudienceSchema,
  UpdateAudienceSchema,
  ListAudienceQuerySchema,
  AudienceResponseSchema,
  AudienceTreeResponseSchema,
} from '../domain/audience.schema';
import { AuthError } from '../domain/auth.schema';

export function getAudienceOpenApiPaths() {
  const registry = new OpenAPIRegistry();

  /* -------------------------------------------------------------------------- */
  /*  Create Audience                                                            */
  /* -------------------------------------------------------------------------- */
  registry.registerPath({
    method: 'post',
    path: '/orgs/{orgId}/audiences',
    summary: 'Create a new audience under an organisation',
    tags: ['audiences'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        orgId: z.string().describe('Organisation ID'),
      }),
      body: {
        content: {
          'application/json': {
            schema: CreateAudienceSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Audience created',
        content: {
          'application/json': { schema: AudienceResponseSchema },
        },
      },
      400: {
        description: 'Invalid input or duplicate name',
        content: { 'application/json': { schema: AuthError } },
      },
      403: {
        description: 'Forbidden',
        content: { 'application/json': { schema: AuthError } },
      },
    },
  });

  /* -------------------------------------------------------------------------- */
  /*  List Audiences (flat or tree)                                              */
  /* -------------------------------------------------------------------------- */
  registry.registerPath({
    method: 'get',
    path: '/orgs/{orgId}/audiences',
    summary: 'List audiences in an organisation (flat or tree)',
    tags: ['audiences'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        orgId: z.string(),
      }),
      query: ListAudienceQuerySchema,
    },
    responses: {
      200: {
        description: 'Audience list',
        content: {
          'application/json': {
            schema: z.union([
              z.array(AudienceResponseSchema),
              AudienceTreeResponseSchema,
            ]),
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: { 'application/json': { schema: AuthError } },
      },
    },
  });

  /* -------------------------------------------------------------------------- */
  /*  Get Single Audience                                                        */
  /* -------------------------------------------------------------------------- */
  registry.registerPath({
    method: 'get',
    path: '/orgs/{orgId}/audiences/{audienceId}',
    summary: 'Get a single audience by ID',
    tags: ['audiences'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        orgId: z.string(),
        audienceId: z.string(),
      }),
    },
    responses: {
      200: {
        description: 'Audience details',
        content: {
          'application/json': { schema: AudienceResponseSchema },
        },
      },
      404: {
        description: 'Audience not found',
        content: { 'application/json': { schema: AuthError } },
      },
      403: {
        description: 'Forbidden',
        content: { 'application/json': { schema: AuthError } },
      },
    },
  });

  /* -------------------------------------------------------------------------- */
  /*  Update Audience                                                            */
  /* -------------------------------------------------------------------------- */
  registry.registerPath({
    method: 'patch',
    path: '/orgs/{orgId}/audiences/{audienceId}',
    summary: 'Update an audience',
    tags: ['audiences'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        orgId: z.string(),
        audienceId: z.string(),
      }),
      body: {
        content: {
          'application/json': {
            schema: UpdateAudienceSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Audience updated',
        content: {
          'application/json': { schema: AudienceResponseSchema },
        },
      },
      400: {
        description: 'Invalid input or duplicate name',
        content: { 'application/json': { schema: AuthError } },
      },
      404: {
        description: 'Audience not found',
        content: { 'application/json': { schema: AuthError } },
      },
      403: {
        description: 'Forbidden',
        content: { 'application/json': { schema: AuthError } },
      },
    },
  });

  /* -------------------------------------------------------------------------- */
  /*  Delete Audience                                                            */
  /* -------------------------------------------------------------------------- */
  registry.registerPath({
    method: 'delete',
    path: '/orgs/{orgId}/audiences/{audienceId}',
    summary: 'Delete an audience (only if no children or members)',
    tags: ['audiences'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        orgId: z.string(),
        audienceId: z.string(),
      }),
    },
    responses: {
      204: {
        description: 'Audience deleted',
      },
      400: {
        description: 'Audience has children or members',
        content: { 'application/json': { schema: AuthError } },
      },
      404: {
        description: 'Audience not found',
        content: { 'application/json': { schema: AuthError } },
      },
      403: {
        description: 'Forbidden',
        content: { 'application/json': { schema: AuthError } },
      },
    },
  });

  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Audience API',
      version: '1.0.0',
    },
  });
}