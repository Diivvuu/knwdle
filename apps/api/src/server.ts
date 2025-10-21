import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth';
import orgTypeRoutes from './routes/org.types';
import orgDashboardRoutes from './routes/org.mega.dashboard';
import orgRoutes from './routes/orgs';
import inviteRoutes from './routes/invite';
import invitesRoutes from './routes/invites';
import roleRoutes from './routes/roles';
import orgUnitTypeRoutes from './routes/orgs/org.unit.types';
import uploadRoutes from './routes/uploads';
import { buildOpenApiDocument } from './lib/openapi';

const app = express();
const PORT = Number(process.env.API_PORT || 4000);
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, cb) => {
      const allow = (process.env.CORS_ORIGINS || '')
        .split(',')
        .map((s) => s.trim().replace(/\/+$/, '')) // strip trailing slash
        .filter(Boolean);

      // Allow server-to-server or curl (no Origin header)
      if (!origin) return cb(null, true);

      const normalized = origin.replace(/\/+$/, '');
      if (allow.includes(normalized)) return cb(null, true);

      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
  })
);

const openapiDoc = buildOpenApiDocument();
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/openapi.json', (_req, res) => res.json(openapiDoc));
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(openapiDoc, { explorer: true })
);
app.use('/auth', authRoutes);
// dashboard specific org routes
app.use('/dashboard', orgDashboardRoutes);
app.use('/api', orgTypeRoutes);
// admin specific app org routes
app.use('/api', orgRoutes);
app.use('/api', inviteRoutes);
app.use('/api', invitesRoutes);
app.use('/api', roleRoutes);
app.use('/api', orgUnitTypeRoutes);
app.use('/api', uploadRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);

  console.error('[GlobalError]', err); // helpful in dev logs
  const status = err.status || 500;
  res.status(status).json({
    error:
      err.message ||
      'An unexpected error occurred. Please try again or contact support.',
  });
});

app.listen(PORT, () => console.log(`AP running at http://localhost:${PORT}`));
