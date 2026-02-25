import express from 'express';
import { requireAuth } from './middleware/requireAuth';
import { apiRepository } from './repositories/apiRepository';
import { apiKeyRepository } from './repositories/apiKeyRepository';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'callora-backend' });
});

app.get('/api/apis', (_req, res) => {
  res.json({ apis: [] });
});

app.post('/api/apis/:apiId/keys', requireAuth, (req, res) => {
  const { apiId } = req.params;
  const { scopes, rate_limit_per_minute: rateLimitPerMinute } = req.body ?? {};

  if (scopes !== undefined) {
    const scopesAreValid =
      Array.isArray(scopes) && scopes.every((scope) => typeof scope === 'string' && scope.trim().length > 0);

    if (!scopesAreValid) {
      res.status(400).json({ error: 'Invalid scopes. Expected a non-empty string array.' });
      return;
    }
  }

  if (rateLimitPerMinute !== undefined) {
    if (!Number.isInteger(rateLimitPerMinute) || rateLimitPerMinute <= 0) {
      res.status(400).json({ error: 'Invalid rate_limit_per_minute. Expected a positive integer.' });
      return;
    }
  }

  const api = apiRepository.findPublishedActiveById(apiId);
  if (!api) {
    res.status(404).json({ error: 'API not found' });
    return;
  }

  const result = apiKeyRepository.create({
    apiId: api.id,
    userId: req.auth!.userId,
    scopes: scopes ?? [],
    rateLimitPerMinute: rateLimitPerMinute ?? null
  });

  res.status(201).json(result);
});

app.get('/api/usage', (_req, res) => {
  res.json({ calls: 0, period: 'current' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Callora backend listening on http://localhost:${PORT}`);
  });
}

export default app;
