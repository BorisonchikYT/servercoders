import { ICONS } from './icons';

export function Header(): HTMLElement {
  const header = document.createElement('header');
  header.id = 'topbar';
  header.className = [
    'sticky top-0 z-[100] flex items-center justify-between',
    'px-4 md:px-8 py-3.5',
    'bg-bg/75 backdrop-blur-xl backdrop-saturate-150',
    'border-b border-border',
    'transition-all duration-300',
  ].join(' ');
  header.innerHTML = `
    <a href="#" class="flex items-center gap-3 transition-transform hover:-translate-y-0.5">
      <div class="w-9 h-9 grid place-items-center rounded-xs border border-border bg-gradient-to-br from-primary/15 to-accent/15 transition-all hover:rotate-[-8deg] hover:scale-105 hover:shadow-[0_0_24px_rgb(var(--primary)/0.4)]">
        <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
          <defs>
            <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="rgb(var(--primary))" />
              <stop offset="1" stop-color="rgb(var(--accent))" />
            </linearGradient>
          </defs>
          <path d="M9 12l-4 4l4 4M23 12l4 4l-4 4M19 8l-6 16" stroke="url(#brandGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
      </div>
      <div class="flex flex-col gap-px">
        <span class="font-bold text-sm tracking-tight">Сервер Кодеров</span>
        <span class="text-[10px] text-text-muted font-semibold tracking-widest">UTILITIES · API</span>
      </div>
    </a>
    <nav class="flex items-center gap-1.5">
      <a href="#tool" class="hidden md:inline-block text-sm font-medium text-text-muted px-3.5 py-2 rounded-xs transition-colors hover:text-text hover:bg-surface">Инструмент</a>
      <a href="#batch" class="hidden md:inline-block text-sm font-medium text-text-muted px-3.5 py-2 rounded-xs transition-colors hover:text-text hover:bg-surface">Пакетно</a>
      <a href="#api" class="hidden md:inline-block text-sm font-medium text-text-muted px-3.5 py-2 rounded-xs transition-colors hover:text-text hover:bg-surface">API</a>
      <button id="themeToggle" aria-label="Сменить тему" class="relative w-10 h-10 ml-1.5 grid place-items-center rounded-full border border-border bg-surface transition-all hover:border-primary hover:rotate-[15deg] hover:scale-105 hover:shadow-[0_0_24px_rgb(var(--primary)/0.3)]">
        <span class="absolute transition-all duration-300 theme-icon-sun">${ICONS.sun}</span>
        <span class="absolute transition-all duration-300 theme-icon-moon">${ICONS.moon}</span>
      </button>
    </nav>
  `;
  return header;
}

export function initHeader(): void {
  const bar = document.getElementById('topbar');
  if (bar) {
    const onScroll = () => bar.classList.toggle('shadow-lg', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  const toggle = document.getElementById('themeToggle');
  toggle?.addEventListener('click', async () => {
    const { toggleTheme } = await import('../lib/theme');
    const next = toggleTheme();
    document.documentElement.style.setProperty('--pulse', next);
  });
}