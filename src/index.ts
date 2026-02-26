import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { createApp } from './app.js';
import { buildHealthCheckConfig, closeDbPool } from './config/health.js';
import { logger } from './logger.js';
import { metricsMiddleware, metricsEndpoint } from './metrics.js';

const healthCheckConfig = buildHealthCheckConfig();
const app = createApp({ healthCheckConfig });
const PORT = process.env.PORT ?? 3000;

// Inject the metrics middleware globally to track all incoming requests
app.use(metricsMiddleware);
app.get('/api/metrics', metricsEndpoint);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  app.listen(PORT, () => {
    logger.info(`Callora backend listening on http://localhost:${PORT}`);
    if (healthCheckConfig) {
      console.log('✅ Health check endpoint enabled at /api/health');
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing connections...');
    await closeDbPool();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, closing connections...');
    await closeDbPool();
    process.exit(0);
  });
}

export default app;
