const { Redis } = require('@upstash/redis');

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

const NAMES = {
  javascript: 'JavaScript', javascript2: 'JavaScript (legacy)', typescript: 'TypeScript',
  jsx: 'JSX', tsx: 'TSX', vue: 'Vue', svelte: 'Svelte', java: 'Java', kotlin: 'Kotlin',
  swift: 'Swift', c: 'C', cpp: 'C++', csharp: 'C#', cminusminus: 'C--', holyc: 'HolyC',
  go: 'Go', rust: 'Rust', php: 'PHP', python: 'Python 3', python2: 'Python 2',
  ruby: 'Ruby', shell: 'Shell / Bash', sql: 'SQL', css: 'CSS', html: 'HTML', xml: 'XML',
  yaml: 'YAML', toml: 'TOML', ini: 'INI', lua: 'Lua', dart: 'Dart',
};

const EXTENSIONS = {
  javascript: 'js', javascript2: 'js', typescript: 'ts', jsx: 'jsx', tsx: 'tsx',
  vue: 'vue', svelte: 'svelte', java: 'java', kotlin: 'kt', swift: 'swift',
  c: 'c', cpp: 'cpp', csharp: 'cs', cminusminus: 'c--', holyc: 'hc', go: 'go',
  rust: 'rs', php: 'php', python: 'py', python2: 'py', ruby: 'rb', shell: 'sh',
  sql: 'sql', css: 'css', html: 'html', xml: 'xml', yaml: 'yml', toml: 'toml',
  ini: 'ini', lua: 'lua', dart: 'dart',
};

const LANG_LIST = Object.keys(LANGUAGES).map((id) => ({
  id, name: NAMES[id], ext: EXTENSIONS[id],
}));

const EXT_TO_LANG = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'jsx',
  ts: 'typescript', tsx: 'tsx', java: 'java', kt: 'kotlin', kts: 'kotlin',
  swift: 'swift', c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp',
  cs: 'csharp', go: 'go', rs: 'rust', php: 'php', py: 'python', pyw: 'python',
  rb: 'ruby', sh: 'shell', bash: 'shell', zsh: 'shell', sql: 'sql',
  css: 'css', scss: 'css', sass: 'css', html: 'html', htm: 'html',
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

function removeComments(code, language, options = {}) {
  const key = String(language).toLowerCase();
  const cfg = LANGUAGES[key];
  if (!cfg) throw new Error(`Язык «${language}» не поддерживается.`);

  const source = key.startsWith('python') ? stripPythonTripleStrings(code) : code;

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

  const result = finalize(code, cleaned, lines, blocks);
  if (options.minify) {
    result.result = minifyBasic(result.result, key);
    result.stats.after = result.result.length;
    result.stats.saved = Math.max(0, result.stats.before - result.stats.after);
    result.stats.percent = result.stats.before
      ? Math.max(0, Math.round((result.stats.saved / result.stats.before) * 100))
      : 0;
  }
  return result;
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
    codeChars: code.length - commentChars - stringChars,
    avgLineLength: total ? Math.round(code.length / total) : 0,
    minifiedSize: minified.length,
    minifySaving: code.length
      ? Math.max(0, Math.round(((code.length - minified.length) / code.length) * 100))
      : 0,
  };
}

function analyzeCode(code, language) {
  const langName = NAMES[language] || language;
  const stats = countStats(code, language);

  const functions = [];
  const classes = [];
  const imports = [];
  const todos = [];
  const patterns = {
    javascript: [
      { re: /\bfunction\s+(\w+)\s*\(/g, type: 'fn' },
      { re: /\b(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g, type: 'fn' },
      { re: /\b(?:const|let|var)\s+(\w+)\s*=\s*function\s*\(/g, type: 'fn' },
      { re: /\bclass\s+(\w+)/g, type: 'class' },
      { re: /^\s*import\s+(?:[\w*{},\s]+\s+from\s+)?['"]([^'"]+)['"]/gm, type: 'import' },
      { re: /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g, type: 'import' },
    ],
    python: [
      { re: /^\s*def\s+(\w+)\s*\(/gm, type: 'fn' },
      { re: /^\s*class\s+(\w+)/gm, type: 'class' },
      { re: /^\s*(?:from\s+([\w.]+)\s+)?import\s+([\w.,\s]+)/gm, type: 'import' },
    ],
    java: [
      { re: /\b(?:public|private|protected|static|\s)+[\w<>[\]]+\s+(\w+)\s*\([^)]*\)\s*\{/g, type: 'fn' },
      { re: /\bclass\s+(\w+)/g, type: 'class' },
      { re: /^\s*import\s+([\w.]+)\s*;/gm, type: 'import' },
    ],
    go: [
      { re: /\bfunc\s+(\w+)\s*\(/g, type: 'fn' },
      { re: /\btype\s+(\w+)\s+struct\b/g, type: 'class' },
      { re: /^\s*"([^"]+)"\s*$/gm, type: 'import' },
    ],
    rust: [
      { re: /\bfn\s+(\w+)\s*\(/g, type: 'fn' },
      { re: /\bstruct\s+(\w+)/g, type: 'class' },
      { re: /\bimpl\s+(\w+)/g, type: 'class' },
      { re: /^\s*use\s+([\w:]+)/gm, type: 'import' },
    ],
  };

  const list = patterns[language] || patterns.javascript;

  for (const { re, type } of list) {
    let m;
    while ((m = re.exec(code)) !== null) {
      const name = m[1] || m[2];
      if (!name) continue;
      if (type === 'fn' && !functions.includes(name)) functions.push(name);
      if (type === 'class' && !classes.includes(name)) classes.push(name);
      if (type === 'import' && !imports.includes(name)) imports.push(name);
    }
  }

  const todoRe = /(?:\/\/|#|--)\s*(TODO|FIXME|HACK|XXX|NOTE)\b[:\s]*(.*)/gi;
  let tm;
  while ((tm = todoRe.exec(code)) !== null) {
    todos.push({ type: tm[1].toUpperCase(), text: tm[2].trim().slice(0, 80) });
  }

  let complexity = 1;
  complexity += (code.match(/\b(if|else|for|while|switch|case|catch)\b/g) || []).length;
  complexity += (code.match(/&&|\|\|/g) || []).length;

  const grade = complexity < 10 ? 'A' : complexity < 25 ? 'B' : complexity < 50 ? 'C' : 'D';

  return {
    language,
    languageName: langName,
    stats,
    structure: {
      functions: functions.slice(0, 20),
      classes: classes.slice(0, 10),
      imports: imports.slice(0, 15),
      todos: todos.slice(0, 5),
    },
    complexity: { score: complexity, grade },
    summary: {
      functions: functions.length,
      classes: classes.length,
      imports: imports.length,
      todos: todos.length,
    },
  };
}

function generateDiscordEmbed({ language, code, stats, title, color }) {
  const langName = NAMES[language] || language;
  const maxLen = 3900;
  const truncated = code.length > maxLen;
  const preview = truncated ? code.slice(0, maxLen) + '\n…' : code;

  const colors = {
    javascript: 0xF7DF1E, typescript: 0x3178C6, python: 0x3776AB,
    java: 0x007396, c: 0xA8B9CC, cpp: 0x00599C, csharp: 0x239120,
    ruby: 0xCC342D, go: 0x00ADD8, rust: 0xDEA584, php: 0x777BB4,
    html: 0xE34F26, css: 0x1572B6, sql: 0xCC2927,
    shell: 0x4EAA25, kotlin: 0x7F52FF, swift: 0xFA7343, dart: 0x0175C2,
  };

  return {
    content: null,
    embeds: [{
      title: title || `Сниппет · ${langName}`,
      description: '```' + langName.toLowerCase() + '\n' + preview + '\n```',
      color: color || colors[language] || 0x4FD1C5,
      footer: {
        text: stats
          ? `Символов: ${stats.before || code.length} · Строк: ${(stats.totalLines || code.split('\n').length)}`
          : `Символов: ${code.length} · Строк: ${code.split('\n').length}`,
      },
      timestamp: new Date().toISOString(),
    }],
  };
}

function generateExplainEmbed(analysis, title) {
  const { languageName, stats, structure, complexity, summary } = analysis;
  const gradeColors = { A: 0x48BB78, B: 0x4FD1C5, C: 0xF59E0B, D: 0xF56565 };

  const fields = [];

  fields.push({
    name: '📊 Метрики',
    value: [
      `Строк: **${stats.totalLines}** · Кода: **${stats.sourceLines}** · Пустых: **${stats.blankLines}**`,
      `Комментариев: **${stats.commentLines}** строк (${stats.commentChars} симв.)`,
      `Средняя длина строки: **${stats.avgLineLength}** симв.`,
      `Минификация: **−${stats.minifySaving}%**`,
    ].join('\n'),
    inline: false,
  });

  if (structure.functions.length) {
    fields.push({
      name: `🔧 Функции (${summary.functions})`,
      value: '`' + structure.functions.slice(0, 15).join('`, `') + '`' +
        (summary.functions > 15 ? ` …+${summary.functions - 15}` : ''),
      inline: false,
    });
  }

  if (structure.classes.length) {
    fields.push({
      name: `📦 Классы (${summary.classes})`,
      value: '`' + structure.classes.slice(0, 10).join('`, `') + '`',
      inline: true,
    });
  }

  if (structure.imports.length) {
    fields.push({
      name: `📥 Импорты (${summary.imports})`,
      value: '`' + structure.imports.slice(0, 10).join('`, `') + '`',
      inline: true,
    });
  }

  if (structure.todos.length) {
    fields.push({
      name: '📝 TODO / FIXME',
      value: structure.todos.map((t) => `**${t.type}**: ${t.text}`).join('\n'),
      inline: false,
    });
  }

  fields.push({
    name: '🧮 Сложность',
    value: `**${complexity.score}** (оценка **${complexity.grade}**)`,
    inline: true,
  });

  return {
    content: null,
    embeds: [{
      title: title || `Анализ · ${languageName}`,
      color: gradeColors[complexity.grade] || 0x4FD1C5,
      fields,
      footer: { text: 'Сервер Кодеров · автоматический анализ' },
      timestamp: new Date().toISOString(),
    }],
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

let redis = null;
function getRedis() {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

async function checkRateLimit(ip, limit = 30) {
  const r = getRedis();
  if (!r) return true;
  try {
    const key = `rl:${ip}`;
    const count = await r.incr(key);
    if (count === 1) await r.expire(key, 60);
    return count <= limit;
  } catch {
    return true;
  }
}

function getIp(event) {
  return event.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || event.headers['x-real-ip']
    || 'unknown';
}

function randomId(len = 6) {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  let id = '';
  for (let i = 0; i < len; i++) id += alphabet[Math.floor(Math.random() * alphabet.length)];
  return id;
}

module.exports = {
  LANGUAGES, NAMES, EXTENSIONS, LANG_LIST, EXT_TO_LANG,
  escapeRegex, buildTokenRegex, finalize, stripPythonTripleStrings,
  minifyBasic, removeComments, countStats, analyzeCode,
  generateDiscordEmbed, generateExplainEmbed,
  json, checkRateLimit, getIp, getRedis, randomId,
};