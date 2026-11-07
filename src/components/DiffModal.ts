import { ICONS } from './icons';
import { computeDiff, renderDiffToHtml } from '../lib/diff';

let modal: HTMLElement | null = null;

function ensureModal(): HTMLElement {
  if (modal) return modal;
  modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[200] grid place-items-center p-6';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="absolute inset-0 bg-black/70 backdrop-blur-md animate-[fadeIn_0.25s_ease]" data-close></div>
    <div class="relative w-full max-w-3xl max-h-[82vh] flex flex-col rounded-lg border border-border-strong bg-bg-2 shadow-2xl animate-[scaleIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)]">
      <div class="flex items-center justify-between px-5.5 py-4 border-b border-border">
        <h3 class="text-base font-bold">Сравнение «до / после»</h3>
        <button data-close class="grid place-items-center w-9 h-9 rounded-xs border border-border bg-surface text-text-muted transition-all hover:text-primary hover:border-primary">${ICONS.close}</button>
      </div>
      <div id="diffBody" class="flex-1 overflow-auto p-5 font-mono text-xs leading-relaxed"></div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.hasAttribute('data-close') || t.closest('[data-close]')) closeDiff();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDiff();
  });
  return modal;
}

export function openDiff(before: string, after: string): void {
  const m = ensureModal();
  const body = m.querySelector<HTMLElement>('#diffBody')!;
  const segments = computeDiff(before, after, 'lines');
  body.innerHTML = renderDiffToHtml(segments) || '<div class="text-text-muted">Изменений нет.</div>';
  m.hidden = false;
  document.body.style.overflow = 'hidden';
}

export function closeDiff(): void {
  if (modal) modal.hidden = true;
  document.body.style.overflow = '';
}