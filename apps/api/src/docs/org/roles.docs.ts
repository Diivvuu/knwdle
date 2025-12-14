import z from 'zod';
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';
import {
  RoleIdParam,
  RoleCreateBody,
  RoleUpdateBody,
  AssignRoleBody,
  BasicError,
} from '../../domain/roles.schema';
import { OrgIdParam } from '../../domain/org.params';

export function getRolesPaths() {
  const registry = new OpenAPIRegistry();

  // permissions catalog
  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/permissions',
    summary: 'List global permissions catalog',
    tags: ['roles'],
    security: [{ bearerAuth: [] }],
    request: { params: OrgIdParam },
    responses: {
      200: {
        description: 'List of permissions',
        content: {
          'application/json': {
            schema: z.array(
              z.object({ id: z.string(), code: z.string(), name: z.string() })
            ),
          },
        },
      },
      401: {
        description: 'Forbidden',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  // list roles
  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/roles',
    summary: 'List custom roles in an organisation',
    tags: ['roles'],
    security: [{ bearerAuth: [] }],
    request: { params: OrgIdParam },
    responses: {
      200: {
        description: 'List of roles',
        content: { 'application/json': { schema: z.array(z.any()) } },
      },
    },
  });

  // create role
  registry.registerPath({
    method: 'post',
    path: '/api/orgs/{id}/roles',
    summary: 'Create a new custom role',
    tags: ['roles'],
    security: [{ bearerAuth: [] }],
    request: {
      params: OrgIdParam,
      body: { content: { 'application/json': { schema: RoleCreateBody } } },
    },
    responses: {
      201: {
        description: 'Created role',
        content: { 'application/json': { schema: z.any() } },
      },
      400: {
        description: 'Invalid input',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  // update role
  registry.registerPath({
    method: 'patch',
    path: '/api/orgs/{id}/roles/{roleId}',
    summary: 'Update a role and replace its permissions',
    tags: ['roles'],
    security: [{ bearerAuth: [] }],
    request: {
      params: RoleIdParam,
      body: { content: { 'application/json': { schema: RoleUpdateBody } } },
    },
    responses: {
      200: {
        description: 'Updated role',
        content: { 'application/json': { schema: z.any() } },
      },
      404: {
        description: 'Role not found',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  // delete role
  registry.registerPath({
    method: 'delete',
    path: '/api/orgs/{id}/roles/{roleId}',
    summary: 'Delete a custom role',
    tags: ['roles'],
    security: [{ bearerAuth: [] }],
    request: { params: RoleIdParam },
    responses: {
      204: { description: 'Deleted' },
      404: {
        description: 'Role not found',
        content: { 'application/json': { schema: BasicError } },
      },
      409: {
        description: 'Role assigned to members',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  // assign/unassign
  registry.registerPath({
    method: 'patch',
    path: '/api/orgs/{id}/members/role',
    summary: 'Assign or unassign a custom role to a member',
    tags: ['roles'],
    security: [{ bearerAuth: [] }],
    request: {
      params: OrgIdParam,
      body: { content: { 'application/json': { schema: AssignRoleBody } } },
    },
    responses: {
      200: {
        description: 'Updated membership',
        content: { 'application/json': { schema: z.any() } },
      },
      400: {
        description: 'Invalid input or membership not found',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  const gen = new OpenApiGeneratorV3(registry.definitions);
  return gen.generateDocument({
    openapi: '3.0.0',
    info: { title: 'Roles & Permissions API', version: '1.0.0' },
  });
}
