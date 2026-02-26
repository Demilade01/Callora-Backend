import express from 'express';

import {
  InMemoryUsageEventsRepository,
  type GroupBy,
  type UsageEventsRepository,
} from './repositories/usageEventsRepository.js';
import { defaultApiRepository, type ApiRepository } from './repositories/apiRepository.js';
import { defaultDeveloperRepository, type DeveloperRepository } from './repositories/developerRepository.js';
import { apiStatusEnum, type ApiStatus } from './db/schema.js';
import { requireAuth, type AuthenticatedLocals } from './middleware/requireAuth.js';
import { buildDeveloperAnalytics } from './services/developerAnalytics.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestIdMiddleware } from './middleware/requestId.js';

interface AppDependencies {
  usageEventsRepository: UsageEventsRepository;
  apiRepository: ApiRepository;
  developerRepository: DeveloperRepository;
}

const isValidGroupBy = (value: string): value is GroupBy =>
  value === 'day' || value === 'week' || value === 'month';

const parseDate = (value: unknown): Date | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const parseNonNegativeIntegerParam = (
  value: unknown
): { value?: number; invalid: boolean } => {
  if (typeof value !== 'string' || value.trim() === '') {
    return { value: undefined, invalid: false };
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    return { value: undefined, invalid: true };
  }
  return { value: parsed, invalid: false };
};

export const createApp = (dependencies?: Partial<AppDependencies>) => {
  const app = express();
  const usageEventsRepository =
    dependencies?.usageEventsRepository ?? new InMemoryUsageEventsRepository();
  const apiRepository = dependencies?.apiRepository ?? defaultApiRepository;
  const developerRepository = dependencies?.developerRepository ?? defaultDeveloperRepository;

  app.use(requestIdMiddleware);
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

  app.get('/api/developers/apis', requireAuth, async (req, res: express.Response<unknown, AuthenticatedLocals>) => {
    const user = res.locals.authenticatedUser;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const developer = await developerRepository.findByUserId(user.id);
    if (!developer) {
      res.status(404).json({ error: 'Developer profile not found' });
      return;
    }

    const statusParam = typeof req.query.status === 'string' ? req.query.status : undefined;
    let statusFilter: ApiStatus | undefined;
    if (statusParam) {
      if (!apiStatusEnum.includes(statusParam as ApiStatus)) {
        res
          .status(400)
          .json({ error: `status must be one of: ${apiStatusEnum.join(', ')}` });
        return;
      }
      statusFilter = statusParam as ApiStatus;
    }

    const limitParam = parseNonNegativeIntegerParam(req.query.limit);
    if (limitParam.invalid) {
      res.status(400).json({ error: 'limit must be a non-negative integer' });
      return;
    }

    const offsetParam = parseNonNegativeIntegerParam(req.query.offset);
    if (offsetParam.invalid) {
      res.status(400).json({ error: 'offset must be a non-negative integer' });
      return;
    }

    const apis = await apiRepository.listByDeveloper(developer.id, {
      status: statusFilter,
      ...(typeof limitParam.value === 'number' ? { limit: limitParam.value } : {}),
      ...(typeof offsetParam.value === 'number' ? { offset: offsetParam.value } : {}),
    });

    const usageStats = await usageEventsRepository.aggregateByDeveloper(user.id);
    const statsByApi = new Map(usageStats.map((stat) => [stat.apiId, stat]));

    const payload = apis.map((api) => {
      const stats = statsByApi.get(String(api.id));
      const entry: { id: number; name: string; status: ApiStatus; callCount: number; revenue?: string } = {
        id: api.id,
        name: api.name,
        status: api.status,
        callCount: stats?.calls ?? 0,
      };
      if (stats) {
        entry.revenue = stats.revenue.toString();
      }
      return entry;
    });

    res.json({ data: payload });
  });

  app.get('/api/developers/analytics', requireAuth, async (req, res: express.Response<unknown, AuthenticatedLocals>) => {
    const user = res.locals.authenticatedUser;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const groupBy = req.query.groupBy ?? 'day';
    if (typeof groupBy !== 'string' || !isValidGroupBy(groupBy)) {
      res.status(400).json({ error: 'groupBy must be one of: day, week, month' });
      return;
    }

    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);
    if (!from || !to) {
      res.status(400).json({ error: 'from and to are required ISO date values' });
      return;
    }
    if (from > to) {
      res.status(400).json({ error: 'from must be before or equal to to' });
      return;
    }

    const apiId = typeof req.query.apiId === 'string' ? req.query.apiId : undefined;
    if (apiId) {
      const ownsApi = await usageEventsRepository.developerOwnsApi(user.id, apiId);
      if (!ownsApi) {
        res.status(403).json({ error: 'Forbidden: API does not belong to authenticated developer' });
        return;
      }
    }

    const includeTop = req.query.includeTop === 'true';
    const events = await usageEventsRepository.findByDeveloper({
      developerId: user.id,
      from,
      to,
      apiId,
    });

    const analytics = buildDeveloperAnalytics(events, groupBy, includeTop);
    res.json(analytics);
  });

  app.use(errorHandler);
  return app;
};
