import { parsePagination, paginatedResponse } from '../pagination.js';

describe('parsePagination', () => {
  it('returns defaults when no query params given', () => {
    expect(parsePagination({})).toEqual({ limit: 20, offset: 0 });
  });

  it('parses valid limit and offset', () => {
    expect(parsePagination({ limit: '10', offset: '30' })).toEqual({ limit: 10, offset: 30 });
  });

  it('clamps limit to max 100', () => {
    expect(parsePagination({ limit: '500' })).toEqual({ limit: 100, offset: 0 });
  });

  it('clamps limit to min 1', () => {
    expect(parsePagination({ limit: '0' })).toEqual({ limit: 1, offset: 0 });
    expect(parsePagination({ limit: '-5' })).toEqual({ limit: 1, offset: 0 });
  });

  it('clamps offset to min 0', () => {
    expect(parsePagination({ offset: '-10' })).toEqual({ limit: 20, offset: 0 });
  });

  it('handles non-numeric strings gracefully', () => {
    expect(parsePagination({ limit: 'abc', offset: 'xyz' })).toEqual({ limit: 20, offset: 0 });
  });
});

describe('paginatedResponse', () => {
  it('wraps data and meta into the envelope', () => {
    const result = paginatedResponse([{ id: '1' }], { total: 1, limit: 20, offset: 0 });
    expect(result).toEqual({
      data: [{ id: '1' }],
      meta: { total: 1, limit: 20, offset: 0 },
    });
  });

  it('works without total in meta', () => {
    const result = paginatedResponse([], { limit: 20, offset: 0 });
    expect(result).toEqual({
      data: [],
      meta: { limit: 20, offset: 0 },
    });
    expect(result.meta).not.toHaveProperty('total');
  });
});
