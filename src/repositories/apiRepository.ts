import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import type { Api, ApiStatus } from '../db/schema.js';

export interface ApiListFilters {
  status?: ApiStatus;
  limit?: number;
  offset?: number;
}

export interface ApiRepository {
  listByDeveloper(developerId: number, filters?: ApiListFilters): Promise<Api[]>;
}

export const defaultApiRepository: ApiRepository = {
  async listByDeveloper(developerId, filters = {}) {
    let query = db.select().from(schema.apis).where(eq(schema.apis.developer_id, developerId));

    if (filters.status) {
      query = query.where(eq(schema.apis.status, filters.status));
    }

    if (typeof filters.limit === 'number') {
      query = query.limit(filters.limit);
    }

    if (typeof filters.offset === 'number') {
      query = query.offset(filters.offset);
    }

    return query;
  },
};
