import { fileURLToPath } from 'node:url';

import express from 'express';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'callora-backend' });
});

app.get('/api/apis', (_req, res) => {
  res.json({ apis: [] });
});

app.get('/api/usage', (_req, res) => {
  res.json({ calls: 0, period: 'current' });
});

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  app.listen(PORT, () => {
    console.log(`Callora backend listening on http://localhost:${PORT}`);
  });
}

export default app;
