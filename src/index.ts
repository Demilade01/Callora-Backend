import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import adminRouter from './routes/admin.js';
import { parsePagination, paginatedResponse } from './lib/pagination.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-api-key'],
    credentials: true,
  }),
);
app.use(express.json());

app.use('/api/admin', adminRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'callora-backend' });
});

app.get('/api/apis', (req, res) => {
  const { limit, offset } = parsePagination(req.query as { limit?: string; offset?: string });
  res.json(paginatedResponse([], { limit, offset }));
});

app.get('/api/usage', (req, res) => {
  const { limit, offset } = parsePagination(req.query as { limit?: string; offset?: string });
  res.json(paginatedResponse([], { limit, offset }));
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Callora backend listening on http://localhost:${PORT}`);
  });
}

export default app;