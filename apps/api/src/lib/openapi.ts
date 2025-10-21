import {
  OpenAPIObject,
  PathsObject,
  ComponentsObject,
} from 'openapi3-ts/oas30';
import { getAuthOpenApiPaths } from '../routes/auth';
import { getInviteOpenApiPaths } from '../routes/invite';
import { getInvitesOpenApiPaths } from '../routes/invites';

const COOKIE_NAME = process.env.COOKIE_NAME || '__knwdle_session';
const API_PUBLIC_URL =
  process.env.API_PUBLIC_URL ||
  `http://localhost:${process.env.API_PORT || 4000}`;

function mergeDocs(docs: OpenAPIObject[]): OpenAPIObject {
  const mergedPaths: PathsObject = {};
  const mergedComponents: ComponentsObject = {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: COOKIE_NAME,
      },
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
        name: 'invite',
        description: 'Creating bulk invites & streaming their statuses',
      },
    ],
    components: mergedComponents,
    security: [],
    paths: mergedPaths,
  };
}

export function buildOpenApiDocument(): OpenAPIObject {
  const docs = [
    getAuthOpenApiPaths(),
    getInviteOpenApiPaths(),
    getInvitesOpenApiPaths(),
  ];

  return mergeDocs(docs);
}
