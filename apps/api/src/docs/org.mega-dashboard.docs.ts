import { z } from 'zod';
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';
import {
  CreateOrgBody,
  UpdateOrgBody,
  IdParam,
  BasicError,
} from '../domain/org.mega-dashboard.schema';

export function getOrgMegaDashboardPaths() {
  const registry = new OpenAPIRegistry();

  registry.registerPath({
    method: 'post',
    path: '/dashboard/orgs',
    summary: 'Create an organisation',
    tags: ['mega-dashboard'],
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { 'application/json': { schema: CreateOrgBody } } },
    },
    responses: {
      201: {
        description: 'Organisation created',
        content: { 'application/json': { schema: z.any() } },
      },
      400: {
        description: 'Invalid input',
        content: { 'application/json': { schema: BasicError } },
      },
      422: {
        description: 'Invalid meta',
        content: { 'application/json': { schema: BasicError } },
      },
      500: {
        description: 'Server error',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/dashboard/orgs',
    summary: 'List organisations for current user',
    tags: ['mega-dashboard'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'List of orgs with extras',
        content: { 'application/json': { schema: z.array(z.any()) } },
      },
      401: {
        description: 'Forbidden',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/dashboard/orgs/{id}',
    summary: 'Get an organisation with extras',
    tags: ['mega-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: IdParam },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: z.any() } },
      },
      400: {
        description: 'Bad org id',
        content: { 'application/json': { schema: BasicError } },
      },
      401: {
        description: 'Org not found',
        content: { 'application/json': { schema: BasicError } },
      },
      404: {
        description: 'Org not found',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/dashboard/orgs/{id}',
    summary: 'Update organisation settings',
    tags: ['mega-dashboard'],
    security: [{ bearerAuth: [] }],
    request: {
      params: IdParam,
      body: { content: { 'application/json': { schema: UpdateOrgBody } } },
    },
    responses: {
      200: {
        description: 'Updated organisation',
        content: { 'application/json': { schema: z.any() } },
      },
      400: {
        description: 'Invalid input / bad id',
        content: { 'application/json': { schema: BasicError } },
      },
      403: {
        description: 'Forbidden',
        content: { 'application/json': { schema: BasicError } },
      },
      404: {
        description: 'Org not found',
        content: { 'application/json': { schema: BasicError } },
      },
      422: {
        description: 'Invalid meta',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/dashboard/orgs/{id}',
    summary: 'Delete organisation',
    tags: ['mega-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: IdParam },
    responses: {
      204: { description: 'Deleted' },
      400: {
        description: 'Bad org id',
        content: { 'application/json': { schema: BasicError } },
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
    info: { title: 'Org Mega Dashboard API', version: '1.0.0' },
  });
}
