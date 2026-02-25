import express from 'express';
import developerRoutes from './routes/developerRoutes.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use('/api/developers', developerRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'callora-backend' });
});

app.get('/api/apis', (_req, res) => {
  res.json({ apis: [] });
});

app.get('/api/usage', (_req, res) => {
  res.json({ calls: 0, period: 'current' });
});

app.listen(PORT, () => {
  console.log(`Callora backend listening on http://localhost:${PORT}`);
});
