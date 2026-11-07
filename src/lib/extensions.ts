export const EXT_TO_LANG: Record<string, string> = {
    js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'jsx',
    ts: 'typescript', tsx: 'tsx', java: 'java', kt: 'kotlin', kts: 'kotlin',
    swift: 'swift', c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp',
    cs: 'csharp', go: 'go', rs: 'rust', php: 'php', py: 'python', pyw: 'python',
    rb: 'ruby', sh: 'shell', bash: 'shell', zsh: 'shell', sql: 'sql',
    css: 'css', scss: 'css', sass: 'css', html: 'html', htm: 'html',
    xml: 'xml', vue: 'vue', svelte: 'svelte', yml: 'yaml', yaml: 'yaml',
    toml: 'toml', ini: 'ini', lua: 'lua', dart: 'dart',
  };
  
  export function detectLanguage(filename: string): string | null {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    return EXT_TO_LANG[ext] ?? null;
  }