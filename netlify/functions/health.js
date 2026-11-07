const shared = require('./_shared.js');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return shared.json(204, {});
  if (event.httpMethod !== 'GET') return shared.json(405, { error: 'Только GET.' });

  const redis = shared.getRedis();
  let storage = 'not_configured';
  if (redis) {
    try {
      await redis.ping();
      storage = 'ok';
    } catch {
      storage = 'error';
    }
  }

  return shared.json(200, {
    status: 'ok',
    version: '2.1.0',
    timestamp: new Date().toISOString(),
    storage,
    languages: shared.LANG_LIST.length,
    endpoints: [
      'POST /api/remove',
      'GET  /api/remove?action=languages',
      'POST /api/batch',
      'POST /api/stats',
      'POST /api/snippets',
      'POST /api/explain',
      'POST /api/paste',
      'GET  /api/paste?id=...',
      'GET  /api/health',
    ],
  });
};