import z from 'zod';
import {
  OpenAPIObject,
  PathsObject,
  ComponentsObject,
} from 'openapi3-ts/oas30';

import { getAuthOpenApiPaths } from '../docs/auth.docs';
import { getInviteOpenApiPaths } from '../docs/invite.docs';
import { getOrgMegaDashboardPaths } from '../docs/org.mega-dashboard.docs';
import { getOrgTypePaths } from '../docs/org-types.docs';
import { getRolesPaths } from '../docs/roles.docs';
import { getUploadsPaths } from '../docs/uploads.docs';
import { getOrgAdminDashboardPaths } from '../docs/org.admin-dashboard.docs';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { getOrgUnitTypesPaths } from '../docs/org.unit-types.docs';
import { getOrgUnitsPaths } from '../docs/org.unit.docs';
import { getOrgMembersPaths } from '../docs/org.members.docs';

const COOKIE_NAME = process.env.COOKIE_NAME || '__knwdle_session';
const API_PUBLIC_URL =
  process.env.API_PUBLIC_URL ||
  `http://localhost:${process.env.API_PORT || 4000}`;

function mergeDocs(docs: OpenAPIObject[]): OpenAPIObject {
  const mergedPaths: PathsObject = {};
  const mergedComponents: ComponentsObject = {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {},
  };

  for (const d of docs) {
    Object.assign(mergedPaths, d.paths || {});
    Object.assign(mergedComponents.schemas!, d.components?.schemas || {});
  }

  return {
    openapi: '3.0.3',
    info: {
      title: 'Knwdle API',
      version: '1.0.0',
      description:
        'REST API for auth, organisation, units, roles, invites, uploads, and dashboard.',
    },
    servers: [{ url: API_PUBLIC_URL }],
    tags: [
      { name: 'auth', description: 'Authentication & session' },
      { name: 'invite', description: 'Creating & accepting invite' },
      {
        name: 'invites',
        description: 'Creating bulk invites & streaming their statuses',
      },
      {
        name: 'mega-dashboard',
        description: 'CRUD for orgs in mega dashboard in main app',
      },
      {
        name: 'org-types',
        description:
          'Types of orgs and schema of additional fields for each type.',
      },
    ],
    components: mergedComponents,
    security: [{ bearerAuth: [] }],
    paths: mergedPaths,
  };
}

export function buildOpenApiDocument(): OpenAPIObject {
  extendZodWithOpenApi(z);
  const docs = [
    getAuthOpenApiPaths(),
    getInviteOpenApiPaths(),
    getOrgMegaDashboardPaths(),
    getOrgTypePaths(),
    getRolesPaths(),
    getUploadsPaths(),
    getOrgAdminDashboardPaths(),
    getOrgUnitTypesPaths(),
    getOrgUnitsPaths(),
    getOrgMembersPaths(),
  ];

  return mergeDocs(docs);
}
