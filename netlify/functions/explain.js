const shared = require('./_shared.js');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return shared.json(204, {});

  if (event.httpMethod === 'GET') {
    return shared.json(200, {
      endpoint: '/api/explain',
      method: 'POST',
      body: { code: 'string', language: 'string', format: '"json"|"discord"' },
      returns: 'Структурированный анализ: функции, классы, импорты, TODO, сложность',
    });
  }

  if (event.httpMethod !== 'POST') return shared.json(405, { error: 'Только POST.' });

  if (!(await shared.checkRateLimit(shared.getIp(event), 30))) {
    return shared.json(429, { error: 'Слишком много запросов.' });
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return shared.json(400, { error: 'Неверный JSON.' }); }

  const { code, language, format = 'json' } = body;

  if (typeof code !== 'string' || typeof language !== 'string') {
    return shared.json(400, { error: 'Поля "code" и "language" обязательны.' });
  }
  if (code.length > 200_000) {
    return shared.json(413, { error: 'Максимум 200 КБ для анализа.' });
  }

  try {
    const analysis = shared.analyzeCode(code, language);
    if (format === 'discord') {
      return shared.json(200, shared.generateExplainEmbed(analysis));
    }
    return shared.json(200, analysis);
  } catch (err) {
    return shared.json(500, { error: err.message });
  }
};