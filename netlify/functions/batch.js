const { checkRateLimit, getIp } = require('./_shared.js');

const LANGUAGES = {
  javascript: { line: ['//'], block: [['/*', '*/']], strings: ['"', "'", '`'] },
  typescript: { line: ['//'], block: [['/*', '*/']], strings: ['"', "'", '`'] },
  jsx:        { line: ['//'], block: [['/*', '*/']], strings: ['"', "'", '`'] },
  tsx:        { line: ['//'], block: [['/*', '*/']], strings: ['"', "'", '`'] },
  vue:        { line: ['//'], block: [['/*', '*/'], ['<!--', '-->']], strings: ['"', "'", '`'] },
  svelte:     { line: ['//'], block: [['/*', '*/'], ['<!--', '-->']], strings: ['"', "'", '`'] },
  java:       { line: ['//'], block: [['/*', '*/']], strings: ['"', "'"] },
  kotlin:     { line: ['//'], block: [['/*', '*/']], strings: ['"'] },
  swift:      { line: ['//'], block: [['/*', '*/']], strings: ['"'] },
  c:          { line: ['//'], block: [['/*', '*/']], strings: ['"', "'"] },
  cpp:        { line: ['//'], block: [['/*', '*/']], strings: ['"', "'"] },
  csharp:     { line: ['//'], block: [['/*', '*/']], strings: ['"', "'"] },
  go:         { line: ['//'], block: [['/*', '*/']], strings: ['"', '`'] },
  rust:       { line: ['//'], block: [['/*', '*/']], strings: ['"'] },
  php:        { line: ['//', '#'], block: [['/*', '*/']], strings: ['"', "'"] },
  python:     { line: ['#'], block: [['"""', '"""'], ["'''", "'''"]], strings: ['"', "'"] },
  python2:    { line: ['#'], block: [['"""', '"""'], ["'''", "'''"]], strings: ['"', "'"] },
  ruby:       { line: ['#'], block: [['=begin', '=end']], strings: ['"', "'"] },
  shell:      { line: ['#'], block: [], strings: ['"', "'"] },
  sql:        { line: ['--'], block: [['/*', '*/']], strings: ['"', "'"] },
  css:        { line: [], block: [['/*', '*/']], strings: ['"', "'"] },
  html:       { line: [], block: [['<!--', '-->']], strings: [] },
  xml:        { line: [], block: [['<!--', '-->']], strings: [] },
  yaml:       { line: ['#'], block: [], strings: ['"', "'"] },
  toml:       { line: ['#'], block: [], strings: ['"', "'"] },
  ini:        { line: [';', '#'], block: [], strings: ['"', "'"] },
  lua:        { line: ['--'], block: [['--[[', ']]']], strings: ['"', "'"] },
  dart:       { line: ['//'], block: [['/*', '*/']], strings: ['"', "'"] },
};

const EXT_MAP = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'jsx',
  ts: 'typescript', tsx: 'tsx', java: 'java', kt: 'kotlin', kts: 'kotlin',
  swift: 'swift', c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp',
  cs: 'csharp', go: 'go', rs: 'rust', php: 'php', py: 'python',
  pyw: 'python', rb: 'ruby', sh: 'shell', bash: 'shell', zsh: 'shell',
  sql: 'sql', css: 'css', scss: 'css', sass: 'css', html: 'html', htm: 'html',
  xml: 'xml', vue: 'vue', svelte: 'svelte', yml: 'yaml', yaml: 'yaml',
  toml: 'toml', ini: 'ini', lua: 'lua', dart: 'dart',
};

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

function processCode(code, language) {
  const key = String(language).toLowerCase();
  const cfg = LANGUAGES[key];
  if (!cfg) return null;

  let source = key.startsWith('python')
    ? code.replace(/("""[\s\S]*?"""|'''[\s\S]*?''')/g, (m) => (m.includes('\n') ? '""""""' : m))
    : code;

  const stringPattern = cfg.strings.length
    ? new RegExp(`(["'\`](?:\\\\.|[^\\\\"'\`])*["'\`])`, 'g')
    : null;

  const stringIndexes = new Set();
  if (stringPattern) {
    let m;
    while ((m = stringPattern.exec(source)) !== null) stringIndexes.add(m.index);
  }

  const tokenRegex = buildTokenRegex(cfg);
  if (!tokenRegex) return { result: source, lines: 0, blocks: 0 };

  let lines = 0, blocks = 0;
  const cleaned = source.replace(tokenRegex, (match, ...args) => {
    const offset = args[args.length - 2];
    if (stringIndexes.has(offset)) return match;
    const isLine = cfg.line.some((p) => match.startsWith(p));
    const isBlock = cfg.block.some(([open]) => match.startsWith(open));
    if (isLine) { lines++; return ''; }
    if (isBlock) { blocks++; return ''; }
    return match;
  });

  const final = cleaned
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');

  return { result: final, lines, blocks };
}

const json = (statusCode, data) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify(data),
});

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') return json(204, {});
    if (event.httpMethod !== 'POST') return json(405, { error: 'Только POST.' });

    const ip = getIp(event);
    if (!(await checkRateLimit(ip, 10))) {
      return json(429, { error: 'Слишком много запросов.' });
    }

    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return json(400, { error: 'Неверный JSON.' });
    }

    const { files } = body;
    if (!Array.isArray(files)) return json(400, { error: 'Поле "files" должно быть массивом.' });
    if (files.length > 100) return json(413, { error: 'Максимум 100 файлов за раз.' });

    const processed = [];
    let totalSaved = 0;

    for (const f of files) {
      if (!f.name || typeof f.content !== 'string') continue;
      if (f.content.length > 500_000) {
        processed.push({ name: f.name, error: 'Файл больше 500 КБ' });
        continue;
      }
      const ext = f.name.split('.').pop().toLowerCase();
      const lang = EXT_MAP[ext];
      if (!lang) {
        processed.push({ name: f.name, skipped: true, reason: 'Язык не определён' });
        continue;
      }
      try {
        const { result, lines, blocks } = processCode(f.content, lang);
        const saved = f.content.length - result.length;
        if (saved > 0) totalSaved += saved;
        processed.push({
          name: f.name,
          language: lang,
          result,
          stats: { before: f.content.length, after: result.length, saved, linesRemoved: lines, blocksRemoved: blocks },
        });
      } catch (err) {
        processed.push({ name: f.name, error: err.message });
      }
    }

    return json(200, {
      files: processed,
      summary: {
        total: files.length,
        processed: processed.filter((p) => p.result).length,
        totalSaved,
      },
    });
  } catch (err) {
    console.error('[batch] crash:', err);
    return json(500, { error: err.message || 'Ошибка обработки.' });
  }
};