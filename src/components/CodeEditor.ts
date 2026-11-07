import { ICONS } from './icons';
import { api, ApiError } from '../lib/api';
import { highlightToHtml } from '../lib/highlight';
import { copyToClipboard } from '../lib/clipboard';
import { downloadText } from '../lib/download';
import { toastSuccess, toastError } from '../lib/toast';
import { detectLanguage } from '../lib/extensions';
import type { Language } from '../types';

interface State {
  languages: Language[];
  result: string;
}

const state: State = { languages: [], result: '' };

export function CodeEditor(): HTMLElement {
  const section = document.createElement('section');
  section.id = 'tool';
  section.className = 'py-10 pb-20 reveal';
  section.innerHTML = `
    <div class="mb-7">
      <h2 class="text-[clamp(24px,3.5vw,34px)] font-extrabold tracking-tight mb-2">Инструмент</h2>
      <p class="text-[15px] text-text-muted">Вставьте код или перетащите файл — язык определится сам.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      ${panelInput()}
      ${panelOutput()}
    </div>

    <div class="flex justify-center mt-7">
      <button id="removeBtn" disabled class="group inline-flex items-center gap-2.5 px-8 py-3.5 text-[15px] font-semibold rounded-sm bg-gradient-to-br from-primary to-primary-2 text-[#08090d] shadow-[0_4px_20px_rgb(var(--primary)/0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgb(var(--primary)/0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none animate-pulseGlow">
        ${ICONS.trash}
        Удалить комментарии
        <kbd class="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-black/20 border border-black/15 rounded opacity-70 ml-1">⌘↵</kbd>
      </button>
    </div>
  `;
  return section;
}

function panelInput(): string {
  return `
    <div class="flex flex-col rounded-lg border border-border bg-surface backdrop-blur-xl overflow-hidden transition-all focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgb(var(--primary)/0.12)]">
      <div class="flex items-center justify-between gap-3 px-4.5 py-3.5 border-b border-border flex-wrap">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgb(var(--primary))]"></span>
          <h3 class="text-sm font-semibold">Исходный код</h3>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="relative">
            <select id="languageSelect" class="appearance-none pl-3 pr-8 py-2 text-xs font-medium rounded-xs border border-border bg-surface-2 text-text cursor-pointer outline-none transition-all hover:border-border-strong focus:border-primary focus:shadow-[0_0_0_3px_rgb(var(--primary)/0.12)] max-w-[150px]"></select>
            <span class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">${ICONS.chevron}</span>
          </div>
          <label class="grid place-items-center w-9 h-9 rounded-xs border border-border bg-surface text-text-muted cursor-pointer transition-all hover:border-primary hover:text-primary hover:-translate-y-px" title="Загрузить файл">
            <input type="file" id="fileInput" hidden />
            ${ICONS.upload}
          </label>
        </div>
      </div>
      <div class="relative min-h-[380px] flex-1">
        <pre id="inputHighlight" aria-hidden="true" class="absolute inset-0 w-full h-full p-4.5 font-mono text-[13px] leading-relaxed whitespace-pre overflow-hidden pointer-events-none"></pre>
        <textarea id="inputCode" spellcheck="false" class="absolute inset-0 w-full h-full p-4.5 font-mono text-[13px] leading-relaxed bg-transparent text-transparent caret-primary resize-none outline-none whitespace-pre" placeholder="// Вставьте код или перетащите файл…&#10;function greet(name) {&#10;  // приветствие&#10;  return \`Hello \${name}\`;&#10;}"></textarea>
      </div>
      <div class="flex items-center justify-between gap-3 px-4.5 py-3 border-t border-border flex-wrap text-xs">
        <span id="inputStats" class="font-mono text-text-muted text-[11px]">0 символов</span>
        <div class="flex items-center gap-2 flex-wrap">
          <label class="inline-flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" id="minifyCheck" class="sr-only peer" />
            <span class="relative w-8.5 h-5 rounded-full border border-border-strong bg-surface-2 transition-colors peer-checked:bg-primary peer-checked:border-primary">
              <span class="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-text-muted transition-all peer-checked:translate-x-3.5 peer-checked:bg-[#08090d]"></span>
            </span>
            <span class="text-xs text-text-muted">Минифицировать</span>
          </label>
          <button id="sampleBtn" class="px-3.5 py-2 text-xs font-semibold rounded-xs border border-border bg-surface text-text transition-all hover:border-border-strong hover:bg-surface-2">Пример</button>
          <button id="clearBtn" class="px-3.5 py-2 text-xs font-semibold rounded-xs border border-border bg-surface text-text transition-all hover:border-border-strong hover:bg-surface-2">Очистить</button>
        </div>
      </div>
    </div>
  `;
}

function panelOutput(): string {
  return `
    <div class="flex flex-col rounded-lg border border-border bg-surface backdrop-blur-xl overflow-hidden">
      <div class="flex items-center justify-between gap-3 px-4.5 py-3.5 border-b border-border flex-wrap">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgb(var(--success))]"></span>
          <h3 class="text-sm font-semibold">Чистый код</h3>
        </div>
        <div class="flex items-center gap-1.5">
          <button id="diffBtn" disabled title="Diff" class="grid place-items-center w-9 h-9 rounded-xs border border-border bg-surface text-text-muted transition-all hover:text-primary hover:border-primary hover:-translate-y-px disabled:opacity-35 disabled:cursor-not-allowed">${ICONS.diff}</button>
          <button id="swapBtn" disabled title="Swap" class="grid place-items-center w-9 h-9 rounded-xs border border-border bg-surface text-text-muted transition-all hover:text-primary hover:border-primary hover:-translate-y-px disabled:opacity-35 disabled:cursor-not-allowed">${ICONS.swap}</button>
          <button id="copyBtn" disabled title="Копировать" class="grid place-items-center w-9 h-9 rounded-xs border border-border bg-surface text-text-muted transition-all hover:text-primary hover:border-primary hover:-translate-y-px disabled:opacity-35 disabled:cursor-not-allowed">${ICONS.copy}</button>
          <button id="downloadBtn" disabled title="Скачать" class="grid place-items-center w-9 h-9 rounded-xs border border-border bg-surface text-text-muted transition-all hover:text-primary hover:border-primary hover:-translate-y-px disabled:opacity-35 disabled:cursor-not-allowed">${ICONS.download}</button>
        </div>
      </div>
      <div class="relative min-h-[380px] flex-1">
        <pre id="outputHighlight" aria-hidden="true" class="absolute inset-0 w-full h-full p-4.5 font-mono text-[13px] leading-relaxed whitespace-pre overflow-hidden pointer-events-none bg-black/[0.15]"></pre>
        <textarea id="outputCode" readonly spellcheck="false" class="absolute inset-0 w-full h-full p-4.5 font-mono text-[13px] leading-relaxed bg-black/[0.15] text-transparent resize-none outline-none whitespace-pre" placeholder="Здесь появится результат…"></textarea>
      </div>
      <div class="flex items-center justify-between gap-3 px-4.5 py-3 border-t border-border flex-wrap text-xs">
        <span id="outputStats" class="font-mono text-text-dim text-[11px]">—</span>
        <div id="statsChips" class="flex gap-1.5 flex-wrap"></div>
      </div>
    </div>
  `;
}

export async function initEditor(): Promise<void> {
  const input = document.getElementById('inputCode') as HTMLTextAreaElement;
  const output = document.getElementById('outputCode') as HTMLTextAreaElement;
  const inputHighlight = document.getElementById('inputHighlight') as HTMLPreElement;
  const outputHighlight = document.getElementById('outputHighlight') as HTMLPreElement;
  const select = document.getElementById('languageSelect') as HTMLSelectElement;
  const removeBtn = document.getElementById('removeBtn') as HTMLButtonElement;
  const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
  const sampleBtn = document.getElementById('sampleBtn') as HTMLButtonElement;
  const copyBtn = document.getElementById('copyBtn') as HTMLButtonElement;
  const downloadBtn = document.getElementById('downloadBtn') as HTMLButtonElement;
  const swapBtn = document.getElementById('swapBtn') as HTMLButtonElement;
  const diffBtn = document.getElementById('diffBtn') as HTMLButtonElement;
  const fileInput = document.getElementById('fileInput') as HTMLInputElement;
  const inputStats = document.getElementById('inputStats')!;
  const outputStats = document.getElementById('outputStats')!;
  const statsChips = document.getElementById('statsChips')!;
  const minifyCheck = document.getElementById('minifyCheck') as HTMLInputElement;

  try {
    const { languages } = await api.languages();
    state.languages = languages;
    select.innerHTML = languages.map((l) => `<option value="${l.id}">${l.name}</option>`).join('');
    const saved = localStorage.getItem('sc_lang');
    if (saved && languages.some((l) => l.id === saved)) select.value = saved;
  } catch (err) {
    toastError(err instanceof ApiError ? err.message : 'Ошибка загрузки языков');
  }

  const render = () => {
    const lang = select.value || 'javascript';
    inputHighlight.innerHTML = highlightToHtml(input.value, lang);
    outputHighlight.innerHTML = highlightToHtml(output.value, lang);
    inputHighlight.scrollTop = input.scrollTop;
    inputHighlight.scrollLeft = input.scrollLeft;
    outputHighlight.scrollTop = output.scrollTop;
    outputHighlight.scrollLeft = output.scrollLeft;
  };

  const updateStats = () => {
    inputStats.textContent = `${input.value.length.toLocaleString('ru-RU')} символов`;
    removeBtn.disabled = input.value.length === 0;
  };

  const resetOutput = () => {
    state.result = '';
    output.value = '';
    outputStats.textContent = '—';
    statsChips.innerHTML = '';
    [copyBtn, downloadBtn, swapBtn, diffBtn].forEach((b) => (b.disabled = true));
    render();
  };

  input.addEventListener('input', () => {
    updateStats();
    if (state.result) resetOutput();
    render();
  });
  input.addEventListener('scroll', render);
  output.addEventListener('scroll', render);
  select.addEventListener('change', () => {
    localStorage.setItem('sc_lang', select.value);
    resetOutput();
    render();
  });

  const runRemove = async () => {
    const code = input.value;
    if (!code.trim()) return;
    removeBtn.disabled = true;
    removeBtn.innerHTML = 'Обработка…';

    try {
      const data = await api.remove(code, select.value, minifyCheck.checked);
      state.result = data.result;
      output.value = data.result;
      outputStats.textContent = `${data.stats.after.toLocaleString('ru-RU')} символов`;
      statsChips.innerHTML = [
        chip(`−${data.stats.percent}%`, 'bg-primary/10 text-primary border-primary/25'),
        chip(`${data.stats.saved.toLocaleString('ru-RU')} симв.`, 'bg-primary/10 text-primary border-primary/25'),
        chip(`${data.stats.linesRemoved} строковых`, 'bg-primary/10 text-primary border-primary/25'),
        chip(`${data.stats.blocksRemoved} блочных`, 'bg-primary/10 text-primary border-primary/25'),
      ].join('');
      [copyBtn, downloadBtn, swapBtn, diffBtn].forEach((b) => (b.disabled = false));
      render();
      toastSuccess('Комментарии удалены');
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : 'Ошибка');
    } finally {
      removeBtn.disabled = input.value.length === 0;
      removeBtn.innerHTML = `${ICONS.trash} Удалить комментарии`;
    }
  };

  removeBtn.addEventListener('click', runRemove);

  clearBtn.addEventListener('click', () => {
    input.value = '';
    resetOutput();
    updateStats();
  });

  sampleBtn.addEventListener('click', () => {
    input.value = sampleFor(select.value);
    updateStats();
    resetOutput();
    render();
  });

  copyBtn.addEventListener('click', async () => {
    if (!state.result) return;
    if (await copyToClipboard(state.result)) toastSuccess('Скопировано');
    else toastError('Не удалось скопировать');
  });

  downloadBtn.addEventListener('click', () => {
    if (!state.result) return;
    const lang = state.languages.find((l) => l.id === select.value);
    downloadText(state.result, `clean.${lang?.ext ?? 'txt'}`);
  });

  swapBtn.addEventListener('click', () => {
    if (!state.result) return;
    input.value = state.result;
    resetOutput();
    updateStats();
    render();
  });

  diffBtn.addEventListener('click', async () => {
    if (!state.result) return;
    const { openDiff } = await import('../components/DiffModal');
    openDiff(input.value, state.result);
  });

  fileInput.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toastError('Файл больше 2 МБ');
    input.value = await file.text();
    const lang = detectLanguage(file.name);
    if (lang && state.languages.some((l) => l.id === lang)) {
      select.value = lang;
      localStorage.setItem('sc_lang', lang);
    }
    updateStats();
    resetOutput();
    render();
    toastSuccess(`Загружено: ${file.name}`);
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!removeBtn.disabled) runRemove();
    }
  });

  updateStats();
  render();
}

function chip(text: string, cls: string): string {
  return `<span class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full border ${cls}">${text}</span>`;
}

function sampleFor(lang: string): string {
  const samples: Record<string, string> = {
    javascript: `// Build metadata
const appName = "Сервер Кодеров";

/*
  Feature flags
*/
const flags = { beta: true, debug: false };

function greet(name) {
  const msg = \`Hello \${name}\`; // template
  return msg;
}

const pattern = /https?:\\/\\/[^\\s]+/g;
console.log(greet("Developer"));`,
    python: `# Скрипт
# Автор: Сервер Кодеров

"""
Docstring
"""
def greet(name):
    # Возвращает приветствие
    return f"Hello {name}"

print(greet("Developer"))`,
    java: `// Класс
public class App {
    /*
      Точка входа
    */
    public static void main(String[] args) {
        String name = "Developer"; // имя
        System.out.println("Hello " + name);
    }
}`,
    css: `/* Глобальные */
:root { --primary: #4fd1c5; }
body { background: #08090d; }`,
    html: `<!-- Верхний блок -->
<!DOCTYPE html>
<html>
  <head><title>Demo</title></head>
  <body><!-- content --><h1>Hello</h1></body>
</html>`,
  };
  return samples[lang] ?? samples.javascript;
}