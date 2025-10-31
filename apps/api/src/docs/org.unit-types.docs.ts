import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from '@asteasolutions/zod-to-openapi';
import {
  AllowedChildrenResponse,
  AllowedQuery,
  OrgIdParam,
  OrgUnitFeaturesResponse,
  orgUnitTypeParam,
  OrgUnitTypesListResponse,
  OrgUnitUISchemaResponse,
} from '../domain/org.unit-types.schema';
import { BasicError } from '../domain/roles.schema';

export const getOrgUnitTypesPaths = () => {
  const registry = new OpenAPIRegistry();

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/:orgId/org-unit-types',
    summary: 'List all allowed Org Unit Types for this organisation',
    security: [{ bearerAuth: [] }],
    tags: ['org-unit-types'],
    request: {
      params: OrgIdParam,
    },
    responses: {
      200: {
        description: 'List of valid org unit types',
        content: { 'application/json': { schema: OrgUnitTypesListResponse } },
      },
      401: {
        description: 'Invalid org id',
        content: { 'application/json': { schema: BasicError } },
      },
      403: {
        description: 'Forbidden',
        content: { 'application/json': { schema: BasicError } },
      },
      404: {
        description: 'Organisation not found',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{orgId}/org-unit-types/{type}/schema',
    summary: 'Get UI metadata schema for an OrgUnitType',
    tags: ['org-unit-types'],
    security: [{ bearerAuth: [] }],
    request: { params: orgUnitTypeParam },
    responses: {
      200: {
        description: 'UI schema for the requested OrgUnit type',
        content: { 'application/json': { schema: OrgUnitUISchemaResponse } },
      },
      400: {
        description: 'Invalid parameters',
        content: { 'application/json': { schema: BasicError } },
      },
      401: {
        description: 'Unauthenticated',
        content: { 'application/json': { schema: BasicError } },
      },
      403: {
        description: 'Forbidden',
        content: { 'application/json': { schema: BasicError } },
      },
      404: {
        description: 'Org or Schema not found',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{orgId}/org-unit-types/{type}/features',
    summary: 'Get enabled features for an OrgUnitType',
    tags: ['org-unit-types'],
    security: [{ bearerAuth: [] }],
    request: { params: orgUnitTypeParam },
    responses: {
      200: {
        description: 'Feature flags for the requested OrgUnit type',
        content: {
          'application/json': {
            schema: OrgUnitFeaturesResponse,
          },
        },
      },
      400: {
        description: 'Invalid parameters',
        content: { 'application/json': { schema: BasicError } },
      },
      401: {
        description: 'Unauthenticated',
        content: { 'application/json': { schema: BasicError } },
      },
      403: {
        description: 'Forbidden',
        content: { 'application/json': { schema: BasicError } },
      },
      404: {
        description: 'Org or unit type not found',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/:orgId/org-unit-types/allowed',
    summary: 'Get allowed child unit types under a given parent type',
    tags: ['org-unit-types'],
    security: [{ bearerAuth: [] }],
    request: {
      params: OrgIdParam,
      query: AllowedQuery,
    },
    responses: {
      200: {
        description: 'Allowed child org unit types for this parent type',
        content: { 'application/json': { schema: AllowedChildrenResponse } },
      },
      400: {
        description: 'Invalid parameters',
        content: { 'application/json': { schema: BasicError } },
      },
      401: {
        description: 'Unauthenticated',
        content: { 'application/json': { schema: BasicError } },
      },
      403: {
        description: 'Forbidden',
        content: { 'application/json': { schema: BasicError } },
      },
      404: {
        description: 'Organisation not found',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  const gen = new OpenApiGeneratorV3(registry.definitions);
  return gen.generateDocument({
    openapi: '3.0.0',
    info: { title: 'Org Unit Types API', version: '1.0.0' },
  });
};
