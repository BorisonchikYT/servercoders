const { checkRateLimit, getIp } = require('./_shared.js');

const LANGUAGES = {
  javascript:  { line: ['//'], block: [['/*', '*/']], strings: ['"', "'", '`'] },
  javascript2: { line: ['//'], block: [['/*', '*/']], strings: ['"', "'", '`'] },
  typescript:  { line: ['//'], block: [['/*', '*/']], strings: ['"', "'", '`'] },
  jsx:         { line: ['//'], block: [['/*', '*/']], strings: ['"', "'", '`'] },
  tsx:         { line: ['//'], block: [['/*', '*/']], strings: ['"', "'", '`'] },
  vue:         { line: ['//'], block: [['/*', '*/'], ['<!--', '-->']], strings: ['"', "'", '`'] },
  svelte:      { line: ['//'], block: [['/*', '*/'], ['<!--', '-->']], strings: ['"', "'", '`'] },
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
  python2:     { line: ['#'], block: [['"""', '"""'], ["'''", "'''"]], strings: ['"', "'"] },
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

function minifyBasic(code, language) {
  const key = String(language).toLowerCase();
  const cLike = ['javascript', 'javascript2', 'typescript', 'jsx', 'tsx', 'java',
    'kotlin', 'swift', 'c', 'cpp', 'csharp', 'cminusminus', 'holyc', 'go',
    'rust', 'php', 'dart'];
  if (cLike.includes(key)) {
    return code
      .replace(/\s*([{}();,:])\s*/g, '$1')
      .replace(/;\s*}/g, '}')
      .replace(/\s+/g, ' ')
      .trim();
  }
  if (key === 'css') {
    return code.replace(/\s*([{}:;,])\s*/g, '$1').replace(/;\s*}/g, '}').trim();
  }
  if (['html', 'xml', 'vue', 'svelte'].includes(key)) {
    return code.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
  }
  return code.trim();
}

function countStats(code, language) {
  const lines = code.split('\n');
  const total = lines.length;
  const blank = lines.filter((l) => !l.trim()).length;
  const source = lines.filter((l) => l.trim());

  let commentLines = 0;
  let commentChars = 0;
  let stringChars = 0;

  try {
    const key = String(language).toLowerCase();
    const cfg = LANGUAGES[key];
    if (cfg) {
      const stringPattern = cfg.strings.length
        ? new RegExp(`(["'\`](?:\\\\.|[^\\\\"'\`])*["'\`])`, 'g')
        : null;
      if (stringPattern) {
        let m;
        while ((m = stringPattern.exec(code)) !== null) stringChars += m[0].length;
      }
      const regex = buildTokenRegex(cfg);
      if (regex) {
        let m;
        while ((m = regex.exec(code)) !== null) {
          commentChars += m[0].length;
          commentLines += m[0].split('\n').length;
        }
      }
    }
  } catch {}

  const minified = minifyBasic(code, language);

  return {
    totalLines: total,
    blankLines: blank,
    sourceLines: source.length,
    commentLines,
    commentChars,
    stringChars,
    codeChars: Math.max(0, code.length - commentChars - stringChars),
    avgLineLength: total ? Math.round(code.length / total) : 0,
    minifiedSize: minified.length,
    minifySaving: code.length
      ? Math.max(0, Math.round(((code.length - minified.length) / code.length) * 100))
      : 0,
  };
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
  try {
    if (event.httpMethod === 'OPTIONS') return json(204, {});

    if (event.httpMethod === 'GET') {
      return json(200, {
        endpoint: '/api/stats',
        method: 'POST',
        body: { code: 'string', language: 'string' },
        returns: [
          'totalLines', 'blankLines', 'sourceLines', 'commentLines',
          'commentChars', 'stringChars', 'codeChars', 'avgLineLength',
          'minifiedSize', 'minifySaving',
        ],
      });
    }

    if (event.httpMethod !== 'POST') return json(405, { error: 'Только POST.' });

    const ip = getIp(event);
    if (!(await checkRateLimit(ip, 60))) {
      return json(429, { error: 'Слишком много запросов.' });
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
      return json(413, { error: 'Файл слишком большой.' });
    }

    return json(200, { stats: countStats(code, language) });
  } catch (err) {
    console.error('[stats] crash:', err);
    return json(500, { error: err.message || 'Ошибка обработки.' });
  }
};