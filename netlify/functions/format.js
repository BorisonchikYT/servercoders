const shared = require('./_shared.js');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return shared.json(204, {});

  if (event.httpMethod === 'GET') {
    return shared.json(200, {
      endpoint: '/api/format',
      method: 'POST',
      body: { code: 'string', language: 'string', action: 'minify|beautify' },
      returns: { result: 'string', saved: 'number', percent: 'number' },
    });
  }

  if (event.httpMethod !== 'POST') return shared.json(405, { error: 'Только POST.' });

  if (!(await shared.checkRateLimit(shared.getIp(event), 30))) {
    return shared.json(429, { error: 'Слишком много запросов.' });
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return shared.json(400, { error: 'Неверный JSON.' }); }

  const { code, language, action = 'minify' } = body;

  if (typeof code !== 'string' || typeof language !== 'string') {
    return shared.json(400, { error: 'Поля "code" и "language" обязательны.' });
  }
  if (!['minify', 'beautify'].includes(action)) {
    return shared.json(400, { error: 'action должен быть "minify" или "beautify".' });
  }

  try {
    let result;
    if (action === 'minify') {
      result = shared.minifyBasic(code, language);
    } else {
      result = code
        .replace(/[ \t]+$/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/([{};])/g, '$1\n')
        .replace(/\n{2,}/g, '\n')
        .trim();
    }

    const before = code.length;
    const after = result.length;
    const saved = Math.max(0, before - after);
    const percent = before ? Math.round((saved / before) * 100) : 0;

    return shared.json(200, { result, action, saved, percent, before, after });
  } catch (err) {
    return shared.json(500, { error: err.message });
  }
};