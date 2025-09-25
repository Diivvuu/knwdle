import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());

const allowedOrigin = (origin: string | undefined) => {
  if (!origin) return false;
  // allow localtest.me subdomains + http(s) ports
  return origin.includes('.localtest.me') || origin.includes('localhost');
};

app.use(
  cors({
    origin: (origin, cb) => {
      // allow requests with no origin (curl, server-to-server)
      if (!origin) return cb(null, true);
      if (allowedOrigin(origin)) cb(null, true);
      else cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  })
);

app.use('/auth', authRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
