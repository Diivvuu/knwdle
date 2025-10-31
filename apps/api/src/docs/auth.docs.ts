import { z } from 'zod';
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';

import {
  SignupBody,
  LoginBody,
  RequestOtpBody,
  VerifyOtpBody,
  AuthError,
  AuthBasicMessage,
  AuthAccessResponse,
  AuthUser,
  VerifyEmailResponse,
  RefreshResponse,
} from '../domain/auth.schema';
import { InvitePreviewSchema } from '../domain/invite.schema';

export function getAuthOpenApiPaths() {
  const registry = new OpenAPIRegistry();

  registry.registerPath({
    method: 'post',
    path: '/auth/signup',
    summary: 'Create a new user account',
    request: {
      body: { content: { 'application/json': { schema: SignupBody } } },
    },
    responses: {
      200: {
        description: 'Verification email sent',
        content: { 'application/json': { schema: AuthBasicMessage } },
      },
      400: {
        description: 'Invalid input',
        content: { 'application/json': { schema: AuthError } },
      },
      403: {
        description: 'User exists but not verified',
        content: { 'application/json': { schema: AuthError } },
      },
      409: {
        description: 'Already verified',
        content: { 'application/json': { schema: AuthError } },
      },
    },
    tags: ['auth'],
  });

  registry.registerPath({
    method: 'get',
    path: '/auth/verify',
    summary: 'Verify email via token and create session',
    request: { query: z.object({ token: z.string() }) },
    responses: {
      200: {
        description: 'Email verified',
        content: { 'application/json': { schema: VerifyEmailResponse } },
      },
      400: {
        description: 'Invalid/expired token',
        content: { 'application/json': { schema: AuthError } },
      },
    },
    tags: ['auth'],
  });

  registry.registerPath({
    method: 'post',
    path: '/auth/login',
    summary: 'Login with email and password',
    request: {
      body: { content: { 'application/json': { schema: LoginBody } } },
    },
    responses: {
      200: {
        description: 'Logged in',
        content: { 'application/json': { schema: AuthAccessResponse } },
      },
      400: {
        description: 'Invalid body',
        content: { 'application/json': { schema: AuthError } },
      },
      401: {
        description: 'Invalid credentials',
        content: { 'application/json': { schema: AuthError } },
      },
      403: {
        description: 'Email not verified',
        content: { 'application/json': { schema: AuthError } },
      },
    },
    tags: ['auth'],
  });

  registry.registerPath({
    method: 'post',
    path: '/auth/request-otp',
    summary: 'Request a login OTP via email',
    request: {
      body: { content: { 'application/json': { schema: RequestOtpBody } } },
    },
    responses: {
      200: {
        description: 'OTP sent',
        content: { 'application/json': { schema: AuthBasicMessage } },
      },
      400: {
        description: 'Email required',
        content: { 'application/json': { schema: AuthError } },
      },
      404: {
        description: 'User not found',
        content: { 'application/json': { schema: AuthError } },
      },
    },
    tags: ['auth'],
  });

  registry.registerPath({
    method: 'post',
    path: '/auth/verify-otp',
    summary: 'Verify OTP and login',
    request: {
      body: { content: { 'application/json': { schema: VerifyOtpBody } } },
    },
    responses: {
      200: {
        description: 'OTP login success',
        content: { 'application/json': { schema: AuthAccessResponse } },
      },
      400: {
        description: 'Invalid/expired OTP',
        content: { 'application/json': { schema: AuthError } },
      },
      404: {
        description: 'User not found',
        content: { 'application/json': { schema: AuthError } },
      },
    },
    tags: ['auth'],
  });

  registry.registerPath({
    method: 'post',
    path: '/auth/refresh',
    summary: 'Rotate refresh token and get new access token',
    responses: {
      200: {
        description: 'New access token',
        content: { 'application/json': { schema: RefreshResponse } },
      },
      401: {
        description: 'No/invalid session',
        content: { 'application/json': { schema: AuthError } },
      },
    },
    tags: ['auth'],
    security: [{ bearerAuth: [] }],
  });

  registry.registerPath({
    method: 'post',
    path: '/auth/logout',
    summary: 'Logout and clear refresh cookie',
    responses: { 204: { description: 'Logged out' } },
    tags: ['auth'],
    security: [{ bearerAuth: [] }],
  });

  registry.registerPath({
    method: 'get',
    path: '/auth/me',
    summary: 'Get current user + org memberships',
    responses: {
      200: {
        description: 'Current user',
        content: { 'application/json': { schema: z.any() } },
      },
    },
    tags: ['auth'],
    security: [{ bearerAuth: [] }],
  });

  registry.registerPath({
    method: 'get',
    path: '/auth/invites/{token}/preview',
    summary: 'Preview an invite before accepting',
    tags: ['auth'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        token: z.string().describe('Unique invite token'),
      }),
    },
    responses: {
      200: {
        description: 'Invite preview data',
        content: { 'application/json': { schema: InvitePreviewSchema } },
      },
      404: {
        description: 'Invite not found',
        content: { 'application/json': { schema: AuthError } },
      },
      410: {
        description: 'Invite expired',
        content: { 'application/json': { schema: AuthError } },
      },
    },
  });

  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: { title: 'Auth API', version: '1.0.0' },
  });
}
