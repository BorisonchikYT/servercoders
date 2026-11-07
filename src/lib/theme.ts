import type { Theme } from '../types';

const KEY = 'sc_theme';

export function getTheme(): Theme {
  const t = localStorage.getItem(KEY);
  if (t === 'light' || t === 'dark') return t;
  return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#08090d' : '#f6f8fc');
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(KEY, theme);
  applyTheme(theme);
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

export function watchSystemTheme(cb: (t: Theme) => void): () => void {
  const mq = matchMedia('(prefers-color-scheme: light)');
  const handler = () => {
    if (!localStorage.getItem(KEY)) cb(mq.matches ? 'light' : 'dark');
  };
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}