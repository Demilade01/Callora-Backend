import express from 'express';
import { createDeveloperRouter } from './routes/developerRoutes.js';
import { createGatewayRouter } from './routes/gatewayRoutes.js';
import { createProxyRouter } from './routes/proxyRoutes.js';
import { createBillingService } from './services/billingService.js';
import { createRateLimiter } from './services/rateLimiter.js';
import { createUsageStore } from './services/usageStore.js';
import { createSettlementStore } from './services/settlementStore.js';
import { createApiRegistry } from './data/apiRegistry.js';
import { ApiKey } from './types/gateway.js';

const app = express();
app.use(express.json());

// ── Shared Service Instances ────────────────────────────────────────────────
const MOCK_DEVELOPER_BALANCES: Record<string, number> = {
  dev_001: 50.0,
  dev_002: 120.5,
};

const billing = createBillingService(MOCK_DEVELOPER_BALANCES);
const rateLimiter = createRateLimiter(5, 60_000); // 5 reqs per minute
const usageStore = createUsageStore();
const settlementStore = createSettlementStore();
const registry = createApiRegistry();

const apiKeys = new Map<string, ApiKey>([
  ['test-key-1', { key: 'test-key-1', developerId: 'dev_001', apiId: 'api_001' }],
  ['test-key-2', { key: 'test-key-2', developerId: 'dev_002', apiId: 'api_002' }],
]);

// ── Routes ──────────────────────────────────────────────────────────────────

// 1. Developer Dashboard Routes (Auth required)
const developerRouter = createDeveloperRouter({
  settlementStore,
  usageStore,
});
app.use('/api/developers', developerRouter);

// 2. Main API Gateway Proxy (Legacy)
const gatewayRouter = createGatewayRouter({
  billing,
  rateLimiter,
  usageStore,
  upstreamUrl: 'http://localhost:4000', // Mock upstream
  apiKeys,
});
app.use('/api/gateway', gatewayRouter);

// 3. Main API Gateway Proxy (Dynamic V1)
const proxyRouter = createProxyRouter({
  billing,
  rateLimiter,
  usageStore,
  registry,
  apiKeys,
});
app.use('/v1/call', proxyRouter);

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
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