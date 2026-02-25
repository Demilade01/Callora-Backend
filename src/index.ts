import express from 'express';
import developerRoutes from './routes/developerRoutes.js';
import { createGatewayRouter } from './routes/gatewayRoutes.js';
import { createProxyRouter } from './routes/proxyRoutes.js';
import { createBillingService } from './services/billingService.js';
import { createRateLimiter } from './services/rateLimiter.js';
import { createUsageStore } from './services/usageStore.js';
import { createApiRegistry } from './data/apiRegistry.js';
import { ApiKey } from './types/gateway.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use('/api/developers', developerRoutes);

// Shared services
const billing = createBillingService({ dev_001: 1000 });
const rateLimiter = createRateLimiter(100, 60_000);
const usageStore = createUsageStore();

const apiKeys = new Map<string, ApiKey>([
  ['test-key-1', { key: 'test-key-1', developerId: 'dev_001', apiId: 'api_001' }],
]);

// Legacy gateway route (existing)
const gatewayRouter = createGatewayRouter({
  billing,
  rateLimiter,
  usageStore,
  upstreamUrl: process.env.UPSTREAM_URL ?? 'http://localhost:4000',
  apiKeys,
});
app.use('/api/gateway', gatewayRouter);

// New proxy route: /v1/call/:apiSlugOrId/*
const proxyRouter = createProxyRouter({
  billing,
  rateLimiter,
  usageStore,
  registry: createApiRegistry(),
  apiKeys,
  proxyConfig: {
    timeoutMs: parseInt(process.env.PROXY_TIMEOUT_MS ?? '30000', 10),
  },
});
app.use('/v1/call', proxyRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'callora-backend' });
});

app.get('/api/apis', (_req, res) => {
  res.json({ apis: [] });
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