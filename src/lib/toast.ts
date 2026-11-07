import type { ToastKind, ToastOptions } from '../types';

let root: HTMLElement | null = null;

function ensureRoot(): HTMLElement {
  if (root) return root;
  root = document.createElement('div');
  root.id = 'toast-root';
  root.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 items-center';
  root.setAttribute('role', 'status');
  root.setAttribute('aria-live', 'polite');
  document.body.appendChild(root);
  return root;
}

export function toast(message: string, opts: ToastOptions = {}): void {
  const { kind = 'default', duration = 2600 } = opts;
  const host = ensureRoot();

  const el = document.createElement('div');
  el.className = [
    'px-6 py-3 rounded-md text-sm font-medium',
    'bg-bg-2 border border-border',
    'shadow-lg backdrop-blur-xl',
    'animate-[fadeUp_0.4s_cubic-bezier(0.16,1,0.3,1)]',
    kind === 'success' ? 'border-success/50' : '',
    kind === 'error' ? 'border-danger/50' : '',
  ]
    .filter(Boolean)
    .join(' ');
  el.textContent = message;
  host.appendChild(el);

  setTimeout(() => {
    el.style.transition = 'opacity 0.3s, transform 0.3s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-10px)';
    setTimeout(() => el.remove(), 300);
  }, duration);
}

export const toastSuccess = (m: string) => toast(m, { kind: 'success' });
export const toastError = (m: string) => toast(m, { kind: 'error' });