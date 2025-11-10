import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes';
import orgTypeRoutes from './routes/org-types.routes';
import orgMegaDashboardRoutes from './routes/org.mega-dashboard.routes';
import orgRoutes from './routes/orgs';
import inviteRoutes from './routes/invite.routes';
import roleRoutes from './routes/roles.routes';
import uploadRoutes from './routes/uploads.routes';
import notificationRoutes from './routes/notification.routes';

import { buildOpenApiDocument } from './lib/openapi';

const app = express();
const PORT = Number(process.env.API_PORT || 4000);
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no Origin (e.g., curl, Postman)
      if (!origin) return cb(null, true);

      const normalized = origin.replace(/\/+$/, '');

      // ✅ Allowed static list
      const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'http://localhost:3002',
        'http://127.0.0.1:3002',
        'http://localhost:4000',
        'http://127.0.0.1:4000',
        'https://knwdle.com',
        'https://api.knwdle.com',
        'https://connect.knwdle.com',
        'https://admin.knwdle.com',
      ];

      const isAllowed =
        allowedOrigins.includes(normalized) ||
        /\.knwdle\.com$/i.test(normalized); // ✅ allow any subdomain of knwdle.com

      if (isAllowed) return cb(null, true);

      console.warn(`[CORS BLOCKED] ${origin}`);
      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'X-CSRF-Token',
    ],
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
app.use('/dashboard', orgMegaDashboardRoutes);
app.use('/api', orgTypeRoutes);
// admin specific app org routes
app.use('/api', orgRoutes);
app.use('/api', inviteRoutes);
app.use('/api', roleRoutes);
app.use('/api', uploadRoutes);
app.use('/api/notifications', notificationRoutes);

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
