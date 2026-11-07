interface ApiEndpoint {
    icon: string;
    color: string;
    name: string;
    subtitle: string;
    methods: Array<{ method: 'POST' | 'GET'; path: string }>;
    example?: string;
  }
  
  const ENDPOINTS: ApiEndpoint[] = [
    {
      icon: '🧹',
      color: 'rgb(var(--primary))',
      name: 'remove',
      subtitle: 'удаление комментариев',
      methods: [
        { method: 'POST', path: '/api/remove' },
        { method: 'GET', path: '/api/remove?action=languages' },
      ],
      example: `curl -X POST https://codr.netlify.app/api/remove \\
    -H "Content-Type: application/json" \\
    -d '{"code":"# x\\nprint(1)","language":"python"}'`,
    },
    {
      icon: '📊',
      color: 'rgb(var(--accent))',
      name: 'stats',
      subtitle: 'статистика кода',
      methods: [{ method: 'POST', path: '/api/stats' }],
      example: `curl -X POST https://codr.netlify.app/api/stats \\
    -H "Content-Type: application/json" \\
    -d '{"code":"def f():\\n  return 1","language":"python"}'`,
    },
    {
      icon: '💬',
      color: '#ffc107',
      name: 'snippets',
      subtitle: 'Discord embed',
      methods: [{ method: 'POST', path: '/api/snippets' }],
      example: `curl -X POST https://codr.netlify.app/api/snippets \\
    -H "Content-Type: application/json" \\
    -d '{"code":"print(1)","language":"python"}'`,
    },
    {
      icon: '🔗',
      color: 'rgb(var(--danger))',
      name: 'paste',
      subtitle: 'short-link на 24 часа',
      methods: [
        { method: 'POST', path: '/api/paste' },
        { method: 'GET', path: '/api/paste?id=abc123' },
      ],
      example: `curl -X POST https://codr.netlify.app/api/paste \\
    -H "Content-Type: application/json" \\
    -d '{"code":"print(1)","language":"python"}'`,
    },
    {
      icon: '🔬',
      color: 'rgb(var(--success))',
      name: 'explain',
      subtitle: 'анализ структуры',
      methods: [{ method: 'POST', path: '/api/explain' }],
      example: `curl -X POST https://codr.netlify.app/api/explain \\
    -H "Content-Type: application/json" \\
    -d '{"code":"def f():\\n  return 1","language":"python"}'`,
    },
    {
      icon: '💚',
      color: 'rgb(var(--primary-2))',
      name: 'health',
      subtitle: 'статус сервиса',
      methods: [{ method: 'GET', path: '/api/health' }],
      example: `curl https://codr.netlify.app/api/health`,
    },
  ];
  
  export function ApiDocs(): HTMLElement {
    const section = document.createElement('section');
    section.id = 'api';
    section.className = 'py-15 reveal';
    section.innerHTML = `
      <div class="mb-7">
        <h2 class="text-[clamp(24px,3.5vw,34px)] font-extrabold tracking-tight mb-2">Публичный API</h2>
        <p class="text-[15px] text-text-muted">Лимит — 30 запросов/мин с IP. Для Discord-ботов, CI, IDE.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        ${ENDPOINTS.map(renderEndpoint).join('')}
      </div>
    `;
    return section;
  }
  
  function renderEndpoint(e: ApiEndpoint): string {
    const methodsHtml = e.methods
      .map((m) => {
        const bg = m.method === 'POST' ? 'bg-primary text-[#08090d]' : 'bg-accent text-white';
        return `<div class="flex items-center gap-2.5 px-3.5 py-2.5 mb-2.5 rounded-xs border border-border bg-bg-2 font-mono text-xs transition-colors hover:border-border-strong">
          <span class="px-2 py-0.5 text-[10px] font-extrabold rounded ${bg} tracking-wider">${m.method}</span>
          <code>${m.path}</code>
        </div>`;
      })
      .join('');
  
    const exampleHtml = e.example
      ? `<pre class="p-3.5 rounded-xs border border-border bg-bg-2 text-[11.5px] leading-relaxed overflow-x-auto font-mono"><code>${escapeHtml(e.example)}</code></pre>`
      : '';
  
    return `<div class="rounded-md border border-border bg-surface backdrop-blur-xl p-5 transition-all hover:border-border-strong hover:-translate-y-0.5 hover:shadow-lg">
      <div class="flex items-center gap-2.5 mb-3.5 flex-wrap">
        <span class="w-8 h-8 grid place-items-center rounded-xs text-base" style="background: color-mix(in srgb, ${e.color} 12%, transparent); color: ${e.color}">${e.icon}</span>
        <h3 class="text-[15px] font-bold font-mono">${e.name}</h3>
        <span class="text-[11px] text-text-muted ml-auto">${e.subtitle}</span>
      </div>
      ${methodsHtml}
      ${exampleHtml}
    </div>`;
  }
  
  function escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }