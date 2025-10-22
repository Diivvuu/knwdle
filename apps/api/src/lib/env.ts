// src/lib/env.ts
import { z } from 'zod';

const csv = z.string().transform((v) =>
  v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // App
  AUTH_ORIGIN: z.string().url().optional(),
  API_URL: z.string().url().optional(),

  // Auth
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  ACCESS_EXPIRES_MIN: z.coerce.number().default(15),
  REFRESH_EXPIRES_DAYS: z.coerce.number().default(30),

  COOKIE_NAME: z.string().default('__knwdle_session'),
  COOKIE_DOMAIN: z.string().default('localhost'),

  // Mail (SMTP)
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  MAIL_FROM: z.string().default('Knwdle <divyanshu@knwdle.com>'),
  AWS_REGION: z.string(), // e.g. "ap-south-1"
  S3_BUCKET: z.string(), // e.g. "knwdle-uploads"
  MAX_UPLOAD_MB: z.coerce.number().default(5),
  // Optional: if you later put a CDN in front
  S3_PUBLIC_BASE_URL: z.string().url().optional(),
  CORS_ORIGINS: csv.default('http://localhost:3000,http://localhost:4000'),
});

export const env = EnvSchema.parse(process.env);
export const isProd = env.NODE_ENV === 'production';
