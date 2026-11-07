const KEYWORDS = new Set([
    'function','const','let','var','return','if','else','for','while','do',
    'switch','case','break','continue','class','new','this','extends','implements',
    'public','private','protected','static','void','int','string','bool','boolean',
    'true','false','null','undefined','async','await','yield','import','from',
    'export','default','try','catch','finally','throw','typeof','instanceof',
    'def','elif','lambda','pass','in','not','and','or','is','None','True','False',
    'fn','struct','impl','use','mut','pub','enum','match','loop',
    'package','func','go','defer','chan','select','range',
  ]);
  
  const IDENT = /^[A-Za-z_$][\w$]*/;
  const NUMBER = /^\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?/;
  const WS = /^\s+/;
  
  interface Token {
    type: 'kw' | 'str' | 'num' | 'comment' | 'plain' | 'punct';
    value: string;
  }
  
  export interface TokenizeOptions {
    lineComments?: string[];
    blockComments?: Array<[string, string]>;
    strings?: string[];
  }
  
  function defaultOptions(language: string): TokenizeOptions {
    const py = language.startsWith('python');
    const shell = language === 'shell';
    const sql = language === 'sql';
    const css = language === 'css';
    const html = language === 'html' || language === 'xml';
  
    if (py) return { lineComments: ['#'], blockComments: [['"""', '"""'], ["'''", "'''"]], strings: ['"', "'"] };
    if (shell) return { lineComments: ['#'], strings: ['"', "'"] };
    if (sql) return { lineComments: ['--'], blockComments: [['/*', '*/']], strings: ['"', "'"] };
    if (css) return { blockComments: [['/*', '*/']], strings: ['"', "'"] };
    if (html) return { blockComments: [['<!--', '-->']] };
    return { lineComments: ['//'], blockComments: [['/*', '*/']], strings: ['"', "'", '`'] };
  }
  
  function escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  
  export function tokenize(code: string, language: string, opts: TokenizeOptions = {}): Token[] {
    const config = { ...defaultOptions(language), ...opts };
    const { lineComments = [], blockComments = [], strings = [] } = config;
  
    const tokens: Token[] = [];
    let i = 0;
    const n = code.length;
  
    while (i < n) {
      const rest = code.slice(i);
  
      // whitespace
      const ws = WS.exec(rest);
      if (ws) {
        tokens.push({ type: 'plain', value: ws[0] });
        i += ws[0].length;
        continue;
      }
  
      // block comments
      let matchedBlock = false;
      for (const [open, close] of blockComments) {
        if (rest.startsWith(open)) {
          const end = code.indexOf(close, i + open.length);
          const stop = end === -1 ? n : end + close.length;
          tokens.push({ type: 'comment', value: code.slice(i, stop) });
          i = stop;
          matchedBlock = true;
          break;
        }
      }
      if (matchedBlock) continue;
  
      // line comments
      let matchedLine = false;
      for (const mark of lineComments) {
        if (rest.startsWith(mark)) {
          const nl = code.indexOf('\n', i);
          const stop = nl === -1 ? n : nl;
          tokens.push({ type: 'comment', value: code.slice(i, stop) });
          i = stop;
          matchedLine = true;
          break;
        }
      }
      if (matchedLine) continue;
  
      // strings
      const q = rest[0];
      if (strings.includes(q)) {
        let j = i + 1;
        while (j < n) {
          if (code[j] === '\\') { j += 2; continue; }
          if (code[j] === q) { j++; break; }
          j++;
        }
        tokens.push({ type: 'str', value: code.slice(i, j) });
        i = j;
        continue;
      }
  
      // numbers
      const num = NUMBER.exec(rest);
      if (num) {
        tokens.push({ type: 'num', value: num[0] });
        i += num[0].length;
        continue;
      }
  
      // identifiers / keywords
      const id = IDENT.exec(rest);
      if (id) {
        const word = id[0];
        tokens.push({
          type: KEYWORDS.has(word) ? 'kw' : 'plain',
          value: word,
        });
        i += word.length;
        continue;
      }
  
      // punctuation / single char
      tokens.push({ type: 'punct', value: code[i] });
      i++;
    }
  
    return tokens;
  }
  
  export function highlightToHtml(code: string, language: string): string {
    const tokens = tokenize(code, language);
    const out: string[] = [];
  
    for (const tok of tokens) {
      const safe = escapeHtml(tok.value);
      switch (tok.type) {
        case 'kw':
          out.push(`<span class="text-accent font-semibold">${safe}</span>`);
          break;
        case 'str':
          out.push(`<span class="text-success">${safe}</span>`);
          break;
        case 'num':
          out.push(`<span class="text-warning">${safe}</span>`);
          break;
        case 'comment':
          out.push(`<span class="text-text-dim italic">${safe}</span>`);
          break;
        case 'punct':
          out.push(`<span class="text-text-muted">${safe}</span>`);
          break;
        default:
          out.push(safe);
      }
    }
  
    return out.join('');
  }