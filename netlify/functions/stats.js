const shared = require('./_shared.js');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return shared.json(204, {});

  if (event.httpMethod === 'GET') {
    return shared.json(200, {
      endpoint: '/api/stats',
      method: 'POST',
      body: { code: 'string', language: 'string' },
      returns: ['totalLines', 'blankLines', 'sourceLines', 'commentLines',
        'commentChars', 'stringChars', 'codeChars', 'avgLineLength',
        'minifiedSize', 'minifySaving'],
    });
  }

  if (event.httpMethod !== 'POST') return shared.json(405, { error: 'Только POST.' });

  if (!(await shared.checkRateLimit(shared.getIp(event), 60))) {
    return shared.json(429, { error: 'Слишком много запросов.' });
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return shared.json(400, { error: 'Неверный JSON.' }); }

  const { code, language } = body;
  if (typeof code !== 'string' || typeof language !== 'string') {
    return shared.json(400, { error: 'Поля "code" и "language" обязательны.' });
  }
  if (code.length > 2_000_000) {
    return shared.json(413, { error: 'Файл слишком большой.' });
  }

  try {
    return shared.json(200, { stats: shared.countStats(code, language) });
  } catch (err) {
    return shared.json(500, { error: err.message });
  }
};