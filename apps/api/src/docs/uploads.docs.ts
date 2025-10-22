import { z } from 'zod';
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';
import {
  UploadsPresignBody,
  UploadsPresignGetBody,
  UploadsPresignResponse,
  UploadsPresignGetResponse,
  UploadsError,
} from '../domain/uploads.schema';

export function getUploadsPaths() {
  const registry = new OpenAPIRegistry();

  // Presign POST
  registry.registerPath({
    method: 'post',
    path: '/api/uploads/presign',
    summary: 'Create a presigned POST for uploading a private image',
    tags: ['uploads'],
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { 'application/json': { schema: UploadsPresignBody } } },
    },
    responses: {
      200: {
        description: 'Presigned POST created',
        content: { 'application/json': { schema: UploadsPresignResponse } },
      },
      400: {
        description: 'Invalid input',
        content: { 'application/json': { schema: UploadsError } },
      },
      403: {
        description: 'Not a member of the organization',
        content: { 'application/json': { schema: UploadsError } },
      },
      500: {
        description: 'Failed to create presigned upload',
        content: { 'application/json': { schema: UploadsError } },
      },
    },
  });

  // Presign GET
  registry.registerPath({
    method: 'post',
    path: '/api/uploads/presign-get',
    summary: 'Create a short-lived GET URL to read a private object',
    description:
      '• keys under `users/{userId}/...` only for the same user\n• keys under `orgs/{orgId}/...` require org membership',
    tags: ['uploads'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: { 'application/json': { schema: UploadsPresignGetBody } },
      },
    },
    responses: {
      200: {
        description: 'Presigned GET URL created',
        content: { 'application/json': { schema: UploadsPresignGetResponse } },
      },
      400: {
        description: 'Invalid input or invalid key prefix',
        content: { 'application/json': { schema: UploadsError } },
      },
      403: {
        description: 'Forbidden (not a member of the organization)',
        content: { 'application/json': { schema: UploadsError } },
      },
      500: {
        description: 'Failed to create presigned GET URL',
        content: { 'application/json': { schema: UploadsError } },
      },
    },
  });

  const gen = new OpenApiGeneratorV3(registry.definitions);
  return gen.generateDocument({
    openapi: '3.0.0',
    info: { title: 'Uploads API', version: '1.0.0' },
  });
}
