const shared = require('./_shared.js');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return shared.json(204, {});

  const params = event.queryStringParameters || {};

  if (event.httpMethod === 'GET' && params.id) {
    const r = shared.getRedis();
    if (!r) return shared.json(503, { error: 'Хранилище не настроено. Добавь UPSTASH_REDIS_* в env.' });
    try {
      const data = await r.get(`paste:${params.id}`);
      if (!data) return shared.json(404, { error: 'Паста не найдена или истекла (24 часа).' });
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return shared.json(200, parsed);
    } catch (err) {
      return shared.json(500, { error: err.message });
    }
  }

  if (event.httpMethod === 'GET') {
    return shared.json(200, {
      endpoint: '/api/paste',
      methods: {
        POST: { body: { code: 'string', language: 'string', ttl: 'number (seconds, макс 86400)' }, returns: { id: 'string', url: 'string' } },
        GET: { query: '?id=abc123', returns: 'Сохранённый сниппет' },
      },
      note: 'Ссылка вида /p/abc123. Хранение 24 часа.',
    });
  }

  if (event.httpMethod !== 'POST') return shared.json(405, { error: 'Только GET/POST.' });

  if (!(await shared.checkRateLimit(shared.getIp(event), 10))) {
    return shared.json(429, { error: 'Слишком много запросов.' });
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return shared.json(400, { error: 'Неверный JSON.' }); }

  const { code, language, ttl = 86400 } = body;

  if (typeof code !== 'string' || typeof language !== 'string') {
    return shared.json(400, { error: 'Поля "code" и "language" обязательны.' });
  }
  if (code.length > 500_000) {
    return shared.json(413, { error: 'Максимум 500 КБ.' });
  }

  const r = shared.getRedis();
  if (!r) {
    return shared.json(503, {
      error: 'Хранилище не настроено. Добавь UPSTASH_REDIS_REST_URL и UPSTASH_REDIS_REST_TOKEN в Environment variables на Netlify.',
    });
  }

  try {
    const id = shared.randomId(6);
    const payload = {
      id,
      language,
      code,
      createdAt: new Date().toISOString(),
      expiresIn: Math.min(Number(ttl) || 86400, 86400),
    };
    await r.set(`paste:${id}`, JSON.stringify(payload), { ex: Math.min(Number(ttl) || 86400, 86400) });
    return shared.json(200, {
      id,
      url: `https://codr.netlify.app/p/${id}`,
      expiresIn: payload.expiresIn,
    });
  } catch (err) {
    return shared.json(500, { error: err.message });
  }
};