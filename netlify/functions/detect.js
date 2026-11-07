const shared = require('./_shared.js');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return shared.json(204, {});

  if (event.httpMethod === 'GET') {
    return shared.json(200, {
      endpoint: '/api/detect',
      method: 'POST',
      body: { code: 'string' },
      returns: { language: 'string', confidence: 'number' },
    });
  }

  if (event.httpMethod !== 'POST') return shared.json(405, { error: 'Только POST.' });

  if (!(await shared.checkRateLimit(shared.getIp(event), 60))) {
    return shared.json(429, { error: 'Слишком много запросов.' });
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return shared.json(400, { error: 'Неверный JSON.' }); }

  const { code } = body;
  if (typeof code !== 'string' || !code.trim()) {
    return shared.json(400, { error: 'Поле "code" обязательно.' });
  }

  try {
    const detected = shared.detectLanguage(code);
    return shared.json(200, {
      ...detected,
      name: shared.NAMES[detected.language] || detected.language,
    });
  } catch (err) {
    return shared.json(500, { error: err.message });
  }
};