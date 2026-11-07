import { Header, initHeader } from '../components/Header';
import { Hero, animateCounters } from '../components/Hero';
import { CodeEditor, initEditor } from '../components/CodeEditor';
import { Batch, initBatch } from '../components/Batch';
import { ApiDocs } from '../components/ApiDocs';

export async function mountApp(root: HTMLElement): Promise<void> {
  const main = document.createElement('main');
  main.className = 'max-w-7xl mx-auto px-4 md:px-8';

  const hero = Hero();
  const editor = CodeEditor();
  const batch = Batch();
  const api = ApiDocs();

  main.append(hero, editor, batch, api);

  const footer = document.createElement('footer');
  footer.className = 'border-t border-border mt-10 px-4 md:px-8 py-8';
  footer.innerHTML = `
    <div class="max-w-7xl mx-auto flex flex-wrap gap-4 items-center justify-between">
      <div class="flex items-center gap-3">
        <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
          <path d="M9 12l-4 4l4 4M23 12l4 4l-4 4M19 8l-6 16" stroke="rgb(var(--primary))" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
        <div>
          <div class="font-bold text-sm">Сервер Кодеров</div>
          <div class="text-[11px] text-text-muted">Инструмент для разработчиков</div>
        </div>
      </div>
      <p class="text-xs text-text-muted">© 2026 · Сделано с ❤️</p>
    </div>
  `;

  root.append(Header(), main, footer);

  initHeader();
  await initEditor();
  initBatch();
  animateCounters();
}