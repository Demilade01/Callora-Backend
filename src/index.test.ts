import request from 'supertest';
import app from './index';
import { apiKeyRepository } from './repositories/apiKeyRepository';

describe('Health API', () => {
  it('should return ok status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});

describe('POST /api/apis/:apiId/keys', () => {
  it('creates an API key for an authenticated user and returns key + prefix once', async () => {
    const response = await request(app)
      .post('/api/apis/weather-api/keys')
      .set('authorization', 'Bearer user-123')
      .send({
        scopes: ['read:usage'],
        rate_limit_per_minute: 120
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      key: expect.any(String),
      prefix: expect.any(String)
    });
    expect(response.body.key.startsWith('ck_live_')).toBe(true);
    expect(response.body.key.startsWith(response.body.prefix)).toBe(true);

    const stored = apiKeyRepository.listForTesting().at(-1);
    expect(stored?.prefix).toBe(response.body.prefix);
    expect(stored?.keyHash).toBeDefined();
    expect((stored as unknown as { key?: string })?.key).toBeUndefined();
  });

  it('returns 401 when unauthenticated', async () => {
    const response = await request(app).post('/api/apis/weather-api/keys').send({});

    expect(response.status).toBe(401);
  });

  it('returns 400 when scopes are invalid', async () => {
    const response = await request(app)
      .post('/api/apis/weather-api/keys')
      .set('authorization', 'Bearer user-123')
      .send({ scopes: [123] });

    expect(response.status).toBe(400);
  });

  it('returns 400 when rate_limit_per_minute is invalid', async () => {
    const response = await request(app)
      .post('/api/apis/weather-api/keys')
      .set('authorization', 'Bearer user-123')
      .send({ rate_limit_per_minute: 0 });

    expect(response.status).toBe(400);
  });

  it('returns 404 when API is not published and active', async () => {
    const draftApiResponse = await request(app)
      .post('/api/apis/draft-api/keys')
      .set('authorization', 'Bearer user-123')
      .send({});

    const inactiveApiResponse = await request(app)
      .post('/api/apis/inactive-api/keys')
      .set('authorization', 'Bearer user-123')
      .send({});

    const missingApiResponse = await request(app)
      .post('/api/apis/missing-api/keys')
      .set('authorization', 'Bearer user-123')
      .send({});

    expect(draftApiResponse.status).toBe(404);
    expect(inactiveApiResponse.status).toBe(404);
    expect(missingApiResponse.status).toBe(404);
  });
});
