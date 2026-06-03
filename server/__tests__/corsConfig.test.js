const { createCorsOptions, getCorsOrigins, parseOrigins } = require('../config/cors');

const runOriginCheck = (options, origin) =>
  new Promise(resolve => {
    options.origin(origin, (error, allowed) => {
      resolve({ error, allowed });
    });
  });

describe('CORS origin policy', () => {
  const silentLogger = { warn: jest.fn() };

  beforeEach(() => {
    silentLogger.warn.mockClear();
  });

  test('parses comma-separated frontend origins exactly', () => {
    expect(parseOrigins('https://app.example.com, https://admin.example.com,,')).toEqual([
      'https://app.example.com',
      'https://admin.example.com',
    ]);
  });

  test('allows configured production origins', async () => {
    const env = {
      NODE_ENV: 'production',
      FRONTEND_URLS: 'https://app.example.com, https://admin.example.com',
      FRONTEND_URL: 'https://single.example.com',
    };
    const options = createCorsOptions(env, silentLogger);

    await expect(runOriginCheck(options, 'https://admin.example.com')).resolves.toMatchObject({
      error: null,
      allowed: true,
    });
    expect(getCorsOrigins(env)).toContain('https://single.example.com');
  });

  test('rejects random production preview origins', async () => {
    const options = createCorsOptions(
      {
        NODE_ENV: 'production',
        FRONTEND_URLS: 'https://app.example.com',
      },
      silentLogger
    );

    const result = await runOriginCheck(options, 'https://clearpass-random-preview.vercel.app');

    expect(result.allowed).toBeUndefined();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe('Not allowed by CORS');
    expect(silentLogger.warn).toHaveBeenCalledWith(
      'CORS blocked origin:',
      'https://clearpass-random-preview.vercel.app'
    );
  });

  test('allows localhost development origins', async () => {
    const options = createCorsOptions({ NODE_ENV: 'development' }, silentLogger);

    await expect(runOriginCheck(options, 'http://localhost:5173')).resolves.toMatchObject({
      error: null,
      allowed: true,
    });
  });

  test('handles no-origin requests by environment', async () => {
    await expect(
      runOriginCheck(createCorsOptions({ NODE_ENV: 'development' }, silentLogger), undefined)
    ).resolves.toMatchObject({ error: null, allowed: true });

    await expect(
      runOriginCheck(createCorsOptions({ NODE_ENV: 'production' }, silentLogger), undefined)
    ).resolves.toMatchObject({ error: null, allowed: false });

    await expect(
      runOriginCheck(
        createCorsOptions({ NODE_ENV: 'production', ALLOW_NO_ORIGIN_REQUESTS: 'true' }, silentLogger),
        undefined
      )
    ).resolves.toMatchObject({ error: null, allowed: true });
  });
});
