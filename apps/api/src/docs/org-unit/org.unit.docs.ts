import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';
import {
  UnitIdParam,
  CreateOrgUnitBody,
  UpdateOrgUnitBody,
  OrgUnitResponse,
  OrgUnitListResponse,
  OrgUnitTreeResponse,
} from '../../domain/org.unit.schema';
import { OrgIdParam } from '../../domain/org.unit-types.schema';
import z from 'zod';

export function getOrgUnitsPaths() {
  const registry = new OpenAPIRegistry();

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{orgId}/units',
    summary: 'List org units (flat)',
    tags: ['org-units'],
    security: [{ bearerAuth: [] }],
    request: { params: OrgIdParam },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: OrgUnitListResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{orgId}/units/tree',
    summary: 'Get full org unit hierarchy',
    tags: ['org-units'],
    security: [{ bearerAuth: [] }],
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
    path: '/api/orgs/{orgId}/units/{unitId}',
    summary: 'Get org unit details',
    tags: ['org-units'],
    security: [{ bearerAuth: [] }],
    request: { params: UnitIdParam },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: OrgUnitResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/orgs/{orgId}/units',
    summary: 'Create new org unit',
    tags: ['org-units'],
    security: [{ bearerAuth: [] }],
    request: {
      params: OrgIdParam,
      body: { content: { 'application/json': { schema: CreateOrgUnitBody } } },
    },
    responses: {
      201: {
        description: 'Created',
        content: { 'application/json': { schema: OrgUnitResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/orgs/{orgId}/units/{unitId}',
    summary: 'Update org unit',
    tags: ['org-units'],
    security: [{ bearerAuth: [] }],
    request: {
      params: UnitIdParam,
      body: { content: { 'application/json': { schema: UpdateOrgUnitBody } } },
    },
    responses: {
      200: {
        description: 'Updated',
        content: { 'application/json': { schema: OrgUnitResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/orgs/{orgId}/units/{unitId}',
    summary: 'Delete org unit',
    tags: ['org-units'],
    security: [{ bearerAuth: [] }],
    request: { params: UnitIdParam },
    responses: { 204: { description: 'Deleted' } },
  });

  const gen = new OpenApiGeneratorV3(registry.definitions);
  return gen.generateDocument({
    openapi: '3.0.0',
    info: { title: 'Org Units API', version: '1.0.0' },
  });
}
