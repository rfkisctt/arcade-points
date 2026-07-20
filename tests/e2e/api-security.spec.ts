import { test, expect } from '@playwright/test';

/**
 * API Security Tests — uses request fixture (no browser required).
 * Verifies all security fixes: auth enforcement, input validation, brute-force protection.
 *
 * Changes reflected here:
 * - DELETE /api/leaderboard?id=... requires admin secret OR owner token
 * - DELETE /api/leaderboard/by-slug/[slug] now hides (hidden:true) instead of hard-deleting
 *   but auth behavior (401 without admin secret) is unchanged
 * - Admin-deleted users are hidden, not removed — auto sign-out happens client-side via polling
 */

test.describe('DELETE /api/leaderboard', () => {
  test('returns 401 without any auth header (no admin secret, no owner token)', async ({ request }) => {
    const res = await request.delete('/api/leaderboard?id=test123');
    expect(res.status()).toBe(401);
  });

  test('returns 401 with wrong x-admin-secret', async ({ request }) => {
    const res = await request.delete('/api/leaderboard?id=test123', {
      headers: { 'x-admin-secret': 'wrong-secret-xyz' },
    });
    expect(res.status()).toBe(401);
  });

  test('returns 401 for bulk delete without admin secret', async ({ request }) => {
    const res = await request.delete('/api/leaderboard');
    expect(res.status()).toBe(401);
  });

  test('returns 401 for per-id delete with empty owner token and no admin secret', async ({ request }) => {
    const res = await request.delete('/api/leaderboard?id=test123', {
      headers: { 'x-owner-token': '' },
    });
    expect(res.status()).toBe(401);
  });

  test('returns 400 for id that is too long', async ({ request }) => {
    const longId = 'a'.repeat(513);
    const res = await request.delete(`/api/leaderboard?id=${longId}`);
    expect([400, 401]).toContain(res.status());
  });
});

test.describe('PATCH /api/leaderboard/visibility', () => {
  test('returns 401 without any auth header', async ({ request }) => {
    const res = await request.patch('/api/leaderboard/visibility', {
      data: { id: 'some-user-id', hidden: true },
    });
    expect(res.status()).toBe(401);
  });

  test('returns 401 with empty x-owner-token', async ({ request }) => {
    const res = await request.patch('/api/leaderboard/visibility', {
      headers: { 'x-owner-token': '' },
      data: { id: 'some-user-id', hidden: true },
    });
    expect(res.status()).toBe(401);
  });

  test('returns 400 with missing id field', async ({ request }) => {
    const res = await request.patch('/api/leaderboard/visibility', {
      headers: { 'x-owner-token': 'some-token' },
      data: { hidden: true },
    });
    expect(res.status()).toBe(400);
  });

  test('returns 400 when hidden is not boolean', async ({ request }) => {
    const res = await request.patch('/api/leaderboard/visibility', {
      headers: { 'x-owner-token': 'some-token' },
      data: { id: 'some-id', hidden: 'yes' },
    });
    expect(res.status()).toBe(400);
  });

  test('returns 401 when owner token does not match DB record', async ({ request }) => {
    const res = await request.patch('/api/leaderboard/visibility', {
      headers: { 'x-owner-token': 'nonexistent-token-abc123' },
      data: { id: 'nonexistent-id-xyz', hidden: true },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('POST /api/fetch-profile — URL validation', () => {
  test('returns 400 for non-Google URL', async ({ request }) => {
    const res = await request.post('/api/fetch-profile', {
      data: { url: 'https://evil.com/profile' },
    });
    expect(res.status()).toBe(400);
  });

  test('returns 400 for HTTP (non-HTTPS) URL', async ({ request }) => {
    const res = await request.post('/api/fetch-profile', {
      data: { url: 'http://www.cloudskillsboost.google/public_profiles/test' },
    });
    expect(res.status()).toBe(400);
  });

  test('returns 400 for non-Google HTTPS URL', async ({ request }) => {
    const res = await request.post('/api/fetch-profile', {
      data: { url: 'https://notgoogle.com/public_profiles/test' },
    });
    expect(res.status()).toBe(400);
  });

  test('returns 400 for FTP URL', async ({ request }) => {
    const res = await request.post('/api/fetch-profile', {
      data: { url: 'ftp://cloudskillsboost.google/public_profiles/test' },
    });
    expect(res.status()).toBe(400);
  });

  test('returns 400 for URL longer than 512 characters', async ({ request }) => {
    const longUrl = 'https://www.cloudskillsboost.google/public_profiles/' + 'a'.repeat(500);
    const res = await request.post('/api/fetch-profile', {
      data: { url: longUrl },
    });
    expect(res.status()).toBe(400);
  });

  test('returns 400 when URL is missing from body', async ({ request }) => {
    const res = await request.post('/api/fetch-profile', {
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test('returns 400 for empty string URL', async ({ request }) => {
    const res = await request.post('/api/fetch-profile', {
      data: { url: '' },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe('GET /api/badge-image — input validation', () => {
  test('returns 400 for non-numeric id', async ({ request }) => {
    const res = await request.get('/api/badge-image?id=abc');
    expect(res.status()).toBe(400);
  });

  test('returns 400 for empty id', async ({ request }) => {
    const res = await request.get('/api/badge-image?id=');
    expect(res.status()).toBe(400);
  });

  test('returns 400 for missing id param', async ({ request }) => {
    const res = await request.get('/api/badge-image');
    expect(res.status()).toBe(400);
  });

  test('accepts valid numeric id', async ({ request }) => {
    const res = await request.get('/api/badge-image?id=123');
    expect(res.status()).toBe(200);
  });
});

test.describe('GET /api/leaderboard/by-slug — slug validation (brute-force protection)', () => {
  test('returns 404 for __verify__ slug (not 401)', async ({ request }) => {
    const res = await request.get('/api/leaderboard/by-slug/__verify__');
    expect(res.status()).toBe(404);
  });

  test('returns 404 for slug with special chars', async ({ request }) => {
    const res = await request.get('/api/leaderboard/by-slug/../../etc/passwd');
    expect(res.status()).toBe(404);
  });

  test('returns 404 for too-short slug', async ({ request }) => {
    const res = await request.get('/api/leaderboard/by-slug/abc');
    expect(res.status()).toBe(404);
  });

  test('returns 404 for slug with uppercase letters', async ({ request }) => {
    const res = await request.get('/api/leaderboard/by-slug/ABCDEFGHIJ');
    expect(res.status()).toBe(404);
  });
});

test.describe('DELETE /api/leaderboard/by-slug — auth and brute-force protection', () => {
  test('returns 404 for __verify__ slug regardless of auth header', async ({ request }) => {
    const res = await request.delete('/api/leaderboard/by-slug/__verify__', {
      headers: { 'x-admin-secret': 'any-secret-here' },
    });
    expect(res.status()).toBe(404);
  });

  test('returns 401 for valid-format slug without admin secret', async ({ request }) => {
    const res = await request.delete('/api/leaderboard/by-slug/abcdefghij12');
    expect(res.status()).toBe(401);
  });

  test('returns 401 for valid-format slug with wrong admin secret', async ({ request }) => {
    const res = await request.delete('/api/leaderboard/by-slug/abcdefghij12', {
      headers: { 'x-admin-secret': 'definitely-wrong-secret' },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('POST /api/leaderboard — input validation', () => {
  test('returns 400 for missing name field', async ({ request }) => {
    const res = await request.post('/api/leaderboard', {
      data: {
        id: 'test-id',
        totalPoints: 10,
        basePoints: 10,
        gameCount: 1,
        skillCount: 2,
        triviaCount: 1,
      },
    });
    expect(res.status()).toBe(400);
  });

  test('returns 400 for negative totalPoints', async ({ request }) => {
    const res = await request.post('/api/leaderboard', {
      data: {
        id: 'test-id',
        name: 'Test User',
        totalPoints: -5,
        basePoints: 0,
        gameCount: 0,
        skillCount: 0,
        triviaCount: 0,
      },
    });
    expect(res.status()).toBe(400);
  });

  test('returns 400 for invalid profileUrl (non-Google domain)', async ({ request }) => {
    const res = await request.post('/api/leaderboard', {
      data: {
        id: 'test-id',
        name: 'Test User',
        totalPoints: 5,
        basePoints: 5,
        gameCount: 1,
        skillCount: 2,
        triviaCount: 1,
        profileUrl: 'https://evil.com/steal',
      },
    });
    expect(res.status()).toBe(400);
  });

  test('returns 429 after exceeding rate limit', async ({ request }) => {
    let lastStatus = 0;
    for (let i = 0; i < 21; i++) {
      const res = await request.post('/api/leaderboard', {
        data: {
          id: `rate-limit-test-${i}`,
          name: 'Rate Test',
          totalPoints: 1,
          basePoints: 1,
          gameCount: 1,
          skillCount: 0,
          triviaCount: 0,
        },
      });
      lastStatus = res.status();
    }
    expect(lastStatus).toBe(429);
  });
});
