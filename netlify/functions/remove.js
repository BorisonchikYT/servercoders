const shared = require('./_shared.js');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return shared.json(204, {});

  const params = event.queryStringParameters || {};

  if (event.httpMethod === 'GET' && params.action === 'languages') {
    return shared.json(200, { languages: shared.LANG_LIST });
  }

  if (event.httpMethod !== 'POST') return shared.json(405, { error: 'Метод не разрешён.' });

  if (!(await shared.checkRateLimit(shared.getIp(event)))) {
    return shared.json(429, { error: 'Слишком много запросов. Подождите минуту.' });
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return shared.json(400, { error: 'Неверный JSON.' }); }

  const { code, language, minify } = body;

  if (typeof code !== 'string' || typeof language !== 'string') {
    return shared.json(400, { error: 'Поля "code" и "language" обязательны.' });
  }
  if (code.length > 2_000_000) {
    return shared.json(413, { error: 'Слишком большой файл (макс. 2 МБ).' });
  }

  try {
    return shared.json(200, shared.removeComments(code, language, { minify: !!minify }));
  } catch (err) {
    return shared.json(500, { error: err.message || 'Ошибка обработки.' });
  }
};