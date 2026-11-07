const { getRedis } = require('./_shared.js');

const json = (statusCode, data) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify(data),
});

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') return json(204, {});
    if (event.httpMethod !== 'GET') return json(405, { error: 'Только GET.' });

    const redis = getRedis();
    let storage = 'not_configured';
    if (redis) {
      try {
        await redis.ping();
        storage = 'ok';
      } catch (err) {
        storage = 'error: ' + err.message;
      }
    }

    return json(200, {
      status: 'ok',
      version: '2.1.0',
      timestamp: new Date().toISOString(),
      storage,
      redis_env: {
        url: !!process.env.UPSTASH_REDIS_REST_URL,
        token: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      },
    });
  } catch (err) {
    return json(500, { error: err.message });
  }
};