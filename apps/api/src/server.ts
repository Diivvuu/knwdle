import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';

const app = express();
const PORT = Number(process.env.API_PORT || 4000);
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, cb) => {
      const allow = (process.env.CORS_ORIGINS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!origin || allow.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRoutes);

app.listen(PORT, () => console.log(`AP running at http://localhost:${PORT}`));
