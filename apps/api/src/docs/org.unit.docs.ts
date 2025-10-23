import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from '@asteasolutions/zod-to-openapi';
import {
  CreateUnitBody,
  ListUnitsQuery,
  OrgIdParam,
  SearchUnitsQuery,
  UnitIdParam,
  UnitListResponse,
  UnitSchema,
  UpdateUnitBody,
} from '../domain/org.unit.schema';

export function getOrgUnitsPaths() {
  const reg = new OpenAPIRegistry();

  reg.registerPath({
    method: 'post',
    path: '/api/orgs/{id}/units',
    summary: 'Create an org unit (optionally under a parent)',
    tags: ['org-units'],
    security: [{ bearerAuth: [] }],
    request: {
      params: OrgIdParam,
      body: { content: { 'application/json': { schema: CreateUnitBody } } },
    },
    responses: {
      201: {
        description: 'Created',
        content: { 'application/json': { schema: UnitSchema } },
      },
    },
  });

  reg.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/units',
    summary: 'List children (or root units with parentId=null)',
    tags: ['org-units'],
    security: [{ bearerAuth: [] }],
    request: { params: OrgIdParam, query: ListUnitsQuery },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: UnitListResponse } },
      },
    },
  });

  reg.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/units/{unitId}',
    summary: 'Get a single unit',
    tags: ['org-units'],
    security: [{ bearerAuth: [] }],
    request: { params: UnitIdParam },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: UnitSchema } },
      },
    },
  });

  reg.registerPath({
    method: 'patch',
    path: '/api/orgs/{id}/units/{unitId}',
    summary: 'Update an unit (rename/meta) or move by changing parentId',
    tags: ['org-units'],
    security: [{ bearerAuth: [] }],
    request: {
      params: UnitIdParam,
      body: { content: { 'application/json': { schema: UpdateUnitBody } } },
    },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: UnitSchema } },
      },
    },
  });

  reg.registerPath({
    method: 'delete',
    path: '/api/orgs/{id}/units/{unitId}',
    summary: 'Delete a unit (409 if has children unless ?force=true supported)',
    tags: ['org-units'],
    security: [{ bearerAuth: [] }],
    request: { params: UnitIdParam },
    responses: { 204: { description: 'Deleted' } },
  });

  reg.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/units/search',
    summary: 'Search units by name/code (cursor paginated)',
    tags: ['org-units'],
    security: [{ bearerAuth: [] }],
    request: { params: OrgIdParam, query: SearchUnitsQuery },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: UnitListResponse } },
      },
    },
  });

  const gen = new OpenApiGeneratorV3(reg.definitions);
  return gen.generateDocument({
    openapi: '3.0.0',
    info: { title: 'Org Units API', version: '1.0.0' },
  });
}
