const LANGUAGES = {
  javascript:  { line: ['//'], block: [['/*', '*/']], strings: ['"', "'", '`'] },
  typescript:  { line: ['//'], block: [['/*', '*/']], strings: ['"', "'", '`'] },
  jsx:         { line: ['//'], block: [['/*', '*/']], strings: ['"', "'", '`'] },
  java:        { line: ['//'], block: [['/*', '*/']], strings: ['"', "'"] },
  kotlin:      { line: ['//'], block: [['/*', '*/']], strings: ['"'] },
  swift:       { line: ['//'], block: [['/*', '*/']], strings: ['"'] },
  c:           { line: ['//'], block: [['/*', '*/']], strings: ['"', "'"] },
  cpp:         { line: ['//'], block: [['/*', '*/']], strings: ['"', "'"] },
  csharp:      { line: ['//'], block: [['/*', '*/']], strings: ['"', "'"] },
  cminusminus: { line: ['//'], block: [['/*', '*/']], strings: ['"', "'"] },
  holyc:       { line: ['//'], block: [['/*', '*/']], strings: ['"', "'"] },
  go:          { line: ['//'], block: [['/*', '*/']], strings: ['"', '`'] },
  rust:        { line: ['//'], block: [['/*', '*/']], strings: ['"'] },
  php:         { line: ['//', '#'], block: [['/*', '*/']], strings: ['"', "'"] },
  python:      { line: ['#'], block: [['"""', '"""'], ["'''", "'''"]], strings: ['"', "'"] },
  ruby:        { line: ['#'], block: [['=begin', '=end']], strings: ['"', "'"] },
  shell:       { line: ['#'], block: [], strings: ['"', "'"] },
  sql:         { line: ['--'], block: [['/*', '*/']], strings: ['"', "'"] },
  css:         { line: [], block: [['/*', '*/']], strings: ['"', "'"] },
  html:        { line: [], block: [['<!--', '-->']], strings: [] },
  xml:         { line: [], block: [['<!--', '-->']], strings: [] },
  yaml:        { line: ['#'], block: [], strings: ['"', "'"] },
  toml:        { line: ['#'], block: [], strings: ['"', "'"] },
  ini:         { line: [';', '#'], block: [], strings: ['"', "'"] },
  lua:         { line: ['--'], block: [['--[[', ']]']], strings: ['"', "'"] },
  dart:        { line: ['//'], block: [['/*', '*/']], strings: ['"', "'"] },
};

const NAMES = {
  javascript: 'JavaScript', typescript: 'TypeScript', jsx: 'JSX', java: 'Java',
  kotlin: 'Kotlin', swift: 'Swift', c: 'C', cpp: 'C++', csharp: 'C#',
  cminusminus: 'C--', holyc: 'HolyC', go: 'Go', rust: 'Rust', php: 'PHP',
  python: 'Python', ruby: 'Ruby', shell: 'Shell / Bash', sql: 'SQL', css: 'CSS',
  html: 'HTML', xml: 'XML', yaml: 'YAML', toml: 'TOML', ini: 'INI', lua: 'Lua', dart: 'Dart',
};

const LANG_LIST = Object.keys(LANGUAGES).map((id) => ({ id, name: NAMES[id] }));

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function buildTokenRegex(cfg) {
  const parts = [];
  if (cfg.line.length) {
    const l = cfg.line.map(escapeRegex).join('|');
    parts.push(`((${l})[^\\n]*)`);
  }
  for (const [open, close] of cfg.block) {
    parts.push(`(${escapeRegex(open)}[\\s\\S]*?${escapeRegex(close)})`);
  }
  if (!parts.length) return null;
  return new RegExp(parts.join('|'), 'g');
}

function finalize(original, cleaned, lines, blocks) {
  const total = lines + blocks;
  const final = cleaned
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');

  return {
    result: final,
    stats: {
      before: original.length,
      after: final.length,
      saved: Math.max(0, original.length - final.length),
      percent: original.length
        ? Math.max(0, Math.round(((original.length - final.length) / original.length) * 100))
        : 0,
      commentsRemoved: total,
      linesRemoved: lines,
      blocksRemoved: blocks,
    },
  };
}

function stripPythonTripleStrings(src) {
  return src.replace(/("""[\s\S]*?"""|'''[\s\S]*?''')/g, (m) => (m.includes('\n') ? '""""""' : m));
}

function removeComments(code, language) {
  const key = String(language).toLowerCase();
  const cfg = LANGUAGES[key];
  if (!cfg) throw new Error(`Язык «${language}» не поддерживается.`);

  let source = key === 'python' ? stripPythonTripleStrings(code) : code;

  const stringPattern = cfg.strings.length
    ? new RegExp(`(["'\`](?:\\\\.|[^\\\\"'\`])*["'\`])`, 'g')
    : null;

  const stringIndexes = new Set();
  if (stringPattern) {
    let m;
    while ((m = stringPattern.exec(source)) !== null) stringIndexes.add(m.index);
  }

  const tokenRegex = buildTokenRegex(cfg);
  if (!tokenRegex) return finalize(code, source, 0, 0);

  let lines = 0;
  let blocks = 0;

  const cleaned = source.replace(tokenRegex, (match, ...args) => {
    const offset = args[args.length - 2];
    if (stringIndexes.has(offset)) return match;

    const isLine = cfg.line.some((p) => match.startsWith(p));
    const isBlock = cfg.block.some(([open]) => match.startsWith(open));

    if (isLine) { lines++; return ''; }
    if (isBlock) { blocks++; return ''; }
    return match;
  });

  return finalize(code, cleaned, lines, blocks);
}

const json = (statusCode, data) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  },
  body: JSON.stringify(data),
});

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(204, {});

  const params = event.queryStringParameters || {};

  if (event.httpMethod === 'GET' && params.action === 'languages') {
    return json(200, { languages: LANG_LIST });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Метод не разрешён.' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Неверный JSON.' });
  }

  const { code, language } = body;

  if (typeof code !== 'string' || typeof language !== 'string') {
    return json(400, { error: 'Поля "code" и "language" обязательны.' });
  }
  if (code.length > 2_000_000) {
    return json(413, { error: 'Слишком большой файл (макс. 2 МБ).' });
  }

  try {
    return json(200, removeComments(code, language));
  } catch (err) {
    return json(500, { error: err.message || 'Ошибка обработки.' });
  }
};