import { z } from 'zod';
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';
import {
  IdParam,
  ActivityQuery,
  UnitsGlanceResponse,
  MembersPeekResponse,
  AnnouncementsPeekResponse,
  AttendanceSnapshotResponse,
  FeesSnapshotResponse,
} from '../domain/org.admin-dashboard.schema';
import { BasicError } from '../domain/roles.schema';

export function getOrgAdminDashboardPaths() {
  const registry = new OpenAPIRegistry();

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{id}',
    summary: 'Org Dashboard hero card (org + aggregates + signed image URLs)',
    tags: ['admin-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: IdParam },
    responses: {
      200: {
        description: 'Org hero payload',
        content: { 'application/json': { schema: z.any() } },
      },
      400: {
        description: 'Bad org id',
        content: { 'application/json': { schema: BasicError } },
      },
      404: {
        description: 'Org not found',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/summary',
    summary:
      'Lightweight org summary {counts, pending invites, last join time}',
    tags: ['admin-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: IdParam },
    responses: {
      200: {
        description: 'Summary',
        content: { 'application/json': { schema: z.any() } },
      },
      400: {
        description: 'Bad org id',
        content: { 'application/json': { schema: BasicError } },
      },
      404: {
        description: 'Org not found',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/activity',
    summary: 'Org activity feed (cursor-paginated audit log)',
    tags: ['admin-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: IdParam, query: ActivityQuery },
    responses: {
      200: {
        description: 'Activity Page',
        content: { 'application/json': { schema: z.any() } },
      },
      400: {
        description: 'Invalid query/bad org id',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/dashboard-config',
    summary: 'Server-driven dashboard visibility (widgets, tables, caps)',
    tags: ['admin-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: IdParam },
    responses: {
      200: {
        description: 'Dashboard config',
        content: { 'application/json': { schema: z.any() } },
      },
      403: {
        description: 'Forbidden',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/units/glance',
    summary: 'Units at a glance (limited set with member counts)',
    tags: ['admin-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: IdParam },
    responses: {
      200: {
        description: 'List of units with member counts.',
        content: {
          'application/json': { schema: z.array(UnitsGlanceResponse) },
        },
      },
      404: {
        description: 'Org not found',
        content: { 'application/json': { schema: BasicError } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/members/peek',
    summary: 'Recent members (peek view)',
    tags: ['admin-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: IdParam },
    responses: {
      200: {
        description: 'Last few members joined',
        content: {
          'application/json': { schema: z.array(MembersPeekResponse) },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/announcements/peek',
    summary: 'Recent or pinned announcements (peek view)',
    tags: ['admin-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: IdParam },
    responses: {
      200: {
        description: 'Recent announcements list',
        content: {
          'application/json': { schema: z.array(AnnouncementsPeekResponse) },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/attendance/snapshot',
    summary: 'Attendance rate snapshot',
    tags: ['admin-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: IdParam },
    responses: {
      200: {
        description: 'Attendance rate and last sessions summary',
        content: { 'application/json': { schema: AttendanceSnapshotResponse } },
      },
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/orgs/{id}/fees/snapshot',
    summary: 'Fees summary snapshot (paid, due, overdue)',
    tags: ['admin-dashboard'],
    security: [{ bearerAuth: [] }],
    request: { params: IdParam },
    responses: {
      200: {
        description: 'Summary of finance status',
        content: { 'application/json': { schema: FeesSnapshotResponse } },
      },
    },
  });
  const gen = new OpenApiGeneratorV3(registry.definitions);
  return gen.generateDocument({
    openapi: '3.0.0',
    info: { title: 'Admin Dashboard API', version: '1.0.0' },
  });
}
