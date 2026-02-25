import { ApiRegistry, ApiRegistryEntry } from '../types/gateway.js';

/**
 * In-memory API registry.
 * In production this would query a database table.
 */
export class InMemoryApiRegistry implements ApiRegistry {
  private byId = new Map<string, ApiRegistryEntry>();
  private bySlug = new Map<string, ApiRegistryEntry>();

  constructor(entries: ApiRegistryEntry[] = []) {
    for (const entry of entries) {
      this.register(entry);
    }
  }

  register(entry: ApiRegistryEntry): void {
    this.byId.set(entry.id, entry);
    this.bySlug.set(entry.slug, entry);
  }

  resolve(slugOrId: string): ApiRegistryEntry | undefined {
    return this.byId.get(slugOrId) ?? this.bySlug.get(slugOrId);
  }
}

// ── Mock data for development / testing ─────────────────────────────────────

const SEED_ENTRIES: ApiRegistryEntry[] = [
  {
    id: 'api_001',
    slug: 'weather-api',
    base_url: 'http://localhost:4000',
    developerId: 'dev_001',
  },
  {
    id: 'api_002',
    slug: 'translation-api',
    base_url: 'http://localhost:4001',
    developerId: 'dev_002',
  },
];

export function createApiRegistry(
  entries: ApiRegistryEntry[] = SEED_ENTRIES,
): InMemoryApiRegistry {
  return new InMemoryApiRegistry(entries);
}
