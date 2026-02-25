import request from 'supertest';

jest.mock('./lib/prisma.js', () => ({ default: {} }));

import app from './index.js';

describe('Health API', () => {
  it('should return ok status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});

describe('API list endpoints', () => {
  it('GET /api/apis returns paginated response shape', async () => {
    const response = await request(app).get('/api/apis');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(response.body.data).toEqual([]);
    expect(response.body.meta).toMatchObject({ limit: 20, offset: 0 });
  });

  it('GET /api/usage returns paginated response shape', async () => {
    const response = await request(app).get('/api/usage');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(response.body.data).toEqual([]);
    expect(response.body.meta).toMatchObject({ limit: 20, offset: 0 });
  });

  it('respects limit and offset query params', async () => {
    const response = await request(app).get('/api/apis?limit=5&offset=10');
    expect(response.body.meta).toMatchObject({ limit: 5, offset: 10 });
  });
});