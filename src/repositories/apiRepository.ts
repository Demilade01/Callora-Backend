export interface ApiRecord {
  id: string;
  status: 'draft' | 'published';
  active: boolean;
}

const apis = new Map<string, ApiRecord>([
  ['weather-api', { id: 'weather-api', status: 'published', active: true }],
  ['draft-api', { id: 'draft-api', status: 'draft', active: true }],
  ['inactive-api', { id: 'inactive-api', status: 'published', active: false }]
]);

export const apiRepository = {
  findPublishedActiveById(apiId: string): ApiRecord | null {
    const api = apis.get(apiId);

    if (!api) {
      return null;
    }

    if (api.status !== 'published' || !api.active) {
      return null;
    }

    return api;
  }
};
