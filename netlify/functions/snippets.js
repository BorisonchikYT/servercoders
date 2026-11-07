const shared = require('./_shared.js');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return shared.json(204, {});

  if (event.httpMethod === 'GET') {
    return shared.json(200, {
      endpoint: '/api/snippets',
      method: 'POST',
      body: {
        code: 'string',
        language: 'string',
        title: 'string (optional)',
        color: 'number (optional)',
        withStats: 'boolean (optional)',
      },
      returns: 'Discord embed JSON',
    });
  }

  if (event.httpMethod !== 'POST') return shared.json(405, { error: 'Только POST.' });

  if (!(await shared.checkRateLimit(shared.getIp(event), 30))) {
    return shared.json(429, { error: 'Слишком много запросов.' });
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return shared.json(400, { error: 'Неверный JSON.' }); }

  const { code, language, title, color, withStats = false } = body;

  if (typeof code !== 'string' || typeof language !== 'string') {
    return shared.json(400, { error: 'Поля "code" и "language" обязательны.' });
  }
  if (code.length > 50_000) {
    return shared.json(413, { error: 'Максимум 50 000 символов для сниппета.' });
  }

  try {
    const stats = withStats ? shared.countStats(code, language) : null;
    return shared.json(200, shared.generateDiscordEmbed({ language, code, stats, title, color }));
  } catch (err) {
    return shared.json(500, { error: err.message });
  }
};