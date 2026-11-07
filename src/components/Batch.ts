import JSZip from 'jszip';
import { ICONS } from './icons';
import { api, ApiError } from '../lib/api';
import { toastSuccess, toastError } from '../lib/toast';
import { detectLanguage } from '../lib/extensions';
import { downloadBlob } from '../lib/download';

export function Batch(): HTMLElement {
  const section = document.createElement('section');
  section.id = 'batch';
  section.className = 'py-15 reveal';
  section.innerHTML = `
    <div class="mb-7">
      <h2 class="text-[clamp(24px,3.5vw,34px)] font-extrabold tracking-tight mb-2">Пакетная обработка</h2>
      <p class="text-[15px] text-text-muted">Перетащите папку — получите ZIP с чистыми копиями.</p>
    </div>

    <div id="batchDrop" class="relative overflow-hidden rounded-lg border-2 border-dashed border-border-strong bg-surface px-6 py-14 text-center cursor-pointer transition-all hover:border-primary hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgb(var(--primary)/0.15)]">
      <input type="file" id="batchInput" multiple hidden />
      <div class="relative flex flex-col items-center gap-2">
        <div class="w-18 h-18 grid place-items-center rounded-full bg-primary/10 border border-primary/30 text-primary mb-2 transition-all">
          ${ICONS.folder}
        </div>
        <h3 class="text-lg font-bold">Перетащите файлы сюда</h3>
        <p class="text-sm text-text-muted">или <b class="text-primary">выберите на устройстве</b></p>
        <small class="text-[11px] text-text-dim mt-1.5">JS, TS, Python, Java, C, C++, C#, Ruby, Go, Rust, PHP, CSS, HTML и др.</small>
      </div>
    </div>
    <div id="batchResult" class="mt-6"></div>
  `;
  return section;
}

export function initBatch(): void {
  const drop = document.getElementById('batchDrop')!;
  const input = document.getElementById('batchInput') as HTMLInputElement;
  const result = document.getElementById('batchResult')!;

  const handle = async (files: File[]) => {
    const valid = files.filter(
      (f) => detectLanguage(f.name) && f.size <= 500_000
    );
    if (!valid.length) return toastError('Нет подходящих файлов');
    if (valid.length > 100) return toastError('Максимум 100 файлов');

    result.innerHTML = '<div class="text-text-muted">Обработка…</div>';
    const payload = await Promise.all(
      valid.map(async (f) => ({ name: f.name, content: await f.text() }))
    );

    try {
      const data = await api.batch(payload);
      const ok = data.files.filter((f) => f.result);
      const errs = data.files.filter((f) => f.error);
      const skips = data.files.filter((f) => f.skipped);

      let html = `<div class="rounded-md border border-border bg-surface px-5 py-4 mb-3 flex flex-wrap gap-5 text-sm items-center">
        <span>Файлов: <b class="text-primary">${data.summary.total}</b></span>
        <span>Обработано: <b class="text-primary">${data.summary.processed}</b></span>
        <span>Сэкономлено: <b class="text-primary">${data.summary.totalSaved.toLocaleString('ru-RU')}</b> симв.</span>
      </div>`;

      html += '<div class="flex flex-col gap-1.5 mb-4">';
      for (const f of ok) {
        html += `<div class="rounded-sm border border-border bg-surface px-4 py-3 flex justify-between items-center gap-3 text-sm flex-wrap transition-all hover:border-border-strong hover:translate-x-1">
          <span class="font-mono text-text">${escape(f.name)}</span>
          <span class="text-text-muted text-[11px]">−${f.stats!.saved.toLocaleString('ru-RU')} симв · ${f.stats!.linesRemoved} строковых · ${f.stats!.blocksRemoved} блочных</span>
        </div>`;
      }
      for (const f of errs) {
        html += `<div class="rounded-sm border border-border bg-surface px-4 py-3 flex justify-between items-center gap-3 text-sm flex-wrap">
          <span class="font-mono text-text">${escape(f.name)}</span>
          <span class="text-danger text-xs">${escape(f.error ?? '')}</span>
        </div>`;
      }
      for (const f of skips) {
        html += `<div class="rounded-sm border border-border bg-surface px-4 py-3 flex justify-between items-center gap-3 text-sm flex-wrap">
          <span class="font-mono text-text">${escape(f.name)}</span>
          <span class="text-text-muted text-xs">${escape(f.reason ?? '')}</span>
        </div>`;
      }
      html += '</div>';

      if (ok.length) {
        html += `<button id="zipBtn" class="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-sm bg-gradient-to-br from-primary to-primary-2 text-[#08090d] shadow-[0_4px_20px_rgb(var(--primary)/0.25)] transition-all hover:-translate-y-0.5">📦 Скачать ZIP (${ok.length} файл.)</button>`;
      }

      result.innerHTML = html;

      const zipBtn = document.getElementById('zipBtn');
      zipBtn?.addEventListener('click', async () => {
        const zip = new JSZip();
        for (const f of ok) zip.file(f.name, f.result!);
        const blob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(blob, 'clean-project.zip');
        toastSuccess('ZIP скачан');
      });
    } catch (err) {
      result.innerHTML = `<div class="text-danger">${err instanceof ApiError ? err.message : 'Ошибка'}</div>`;
    }
  };

  drop.addEventListener('click', () => input.click());
  drop.addEventListener('dragover', (e) => {
    e.preventDefault();
    drop.classList.add('border-primary', '-translate-y-0.5');
  });
  drop.addEventListener('dragleave', () => {
    drop.classList.remove('border-primary', '-translate-y-0.5');
  });
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('border-primary', '-translate-y-0.5');
    handle(Array.from(e.dataTransfer?.files ?? []));
  });
  input.addEventListener('change', () => {
    handle(Array.from(input.files ?? []));
    input.value = '';
  });
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}