import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from '@asteasolutions/zod-to-openapi';
import { OrgIdParam } from '../../domain/org.params';
import {
  CreateMemberBody,
  OrgMemberIdParams,
  OrgMemberListQuery,
  OrgMemberListResponse,
  OrgMemberResponse,
  UpdateMemberBody,
} from '../../domain/org.members.schema';

export function getOrgMembersPaths() {
  const registry = new OpenAPIRegistry();

  //list members
  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{orgId}/members',
    summary: 'List organisation members',
    tags: ['org-members'],
    security: [{ bearerAuth: [] }],
    request: {
      params: OrgIdParam,
      query: OrgMemberListQuery,
    },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: OrgMemberListResponse } },
      },
    },
  });

  //create member
  registry.registerPath({
    method: 'post',
    path: '/api/orgs/{orgId}/members',
    summary: 'Add a new organisation member',
    tags: ['org-members'],
    security: [{ bearerAuth: [] }],
    request: {
      params: OrgIdParam,
      body: { content: { 'application/json': { schema: CreateMemberBody } } },
    },
    responses: {
      201: {
        description: 'Created',
        content: { 'application/json': { schema: OrgMemberResponse } },
      },
    },
  });

  // get single member detail
  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{orgId}/members/{memberId}',
    summary: 'Get single member details',
    tags: ['org-members'],
    security: [{ bearerAuth: [] }],
    request: {
      params: OrgMemberIdParams,
    },
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: OrgMemberResponse } },
      },
    },
  });

  // update member
  registry.registerPath({
    method: 'patch',
    path: '/api/orgs/{orgId}/members/{memberId}',
    summary: 'Update member role or audience',
    tags: ['org-members'],
    security: [{ bearerAuth: [] }],
    request: {
      params: OrgMemberIdParams,
      body: {
        content: { 'application/json': { schema: UpdateMemberBody } },
      },
    },
    responses: {
      200: {
        description: 'Updated',
        content: { 'application/json': { schema: OrgMemberResponse } },
      },
    },
  });

  // delete member
  registry.registerPath({
    method: 'delete',
    path: '/api/orgs/{orgId}/members/{memberId}',
    summary: 'Remove member from organsiation',
    tags: ['org-members'],
    security: [{ bearerAuth: [] }],
    request: { params: OrgMemberIdParams },
    responses: { 204: { description: 'Deleted' } },
  });

  const gen = new OpenApiGeneratorV3(registry.definitions);
  return gen.generateDocument({
    openapi: '3.0.0',
    info: { title: 'Organisation Members API', version: '1.0.0' },
  });
}
