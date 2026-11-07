const shared = require('./_shared.js');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return shared.json(204, {});
  if (event.httpMethod !== 'POST') return shared.json(405, { error: 'Только POST.' });

  if (!(await shared.checkRateLimit(shared.getIp(event), 10))) {
    return shared.json(429, { error: 'Слишком много запросов.' });
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return shared.json(400, { error: 'Неверный JSON.' }); }

  const { files } = body;
  if (!Array.isArray(files)) return shared.json(400, { error: 'Поле "files" должно быть массивом.' });
  if (files.length > 100) return shared.json(413, { error: 'Максимум 100 файлов за раз.' });

  const processed = [];
  let totalSaved = 0;

  for (const f of files) {
    if (!f.name || typeof f.content !== 'string') continue;
    if (f.content.length > 500_000) {
      processed.push({ name: f.name, error: 'Файл больше 500 КБ' });
      continue;
    }
    const ext = f.name.split('.').pop().toLowerCase();
    const lang = shared.EXT_TO_LANG[ext];
    if (!lang) {
      processed.push({ name: f.name, skipped: true, reason: 'Язык не определён' });
      continue;
    }
    try {
      const { result, stats } = shared.removeComments(f.content, lang);
      if (stats.saved > 0) totalSaved += stats.saved;
      processed.push({ name: f.name, language: lang, result, stats });
    } catch (err) {
      processed.push({ name: f.name, error: err.message });
    }
  }

  return shared.json(200, {
    files: processed,
    summary: {
      total: files.length,
      processed: processed.filter((p) => p.result).length,
      totalSaved,
    },
  });
};