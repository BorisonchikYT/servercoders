const $ = (sel) => document.querySelector(sel);

const state = { result: '', stats: null, languages: [] };

const inputCode = $('#inputCode');
const outputCode = $('#outputCode');
const inputHighlight = $('#inputHighlight code');
const outputHighlight = $('#outputHighlight code');
const languageSelect = $('#languageSelect');
const removeBtn = $('#removeBtn');
const clearBtn = $('#clearBtn');
const sampleBtn = $('#sampleBtn');
const copyBtn = $('#copyBtn');
const downloadBtn = $('#downloadBtn');
const swapBtn = $('#swapBtn');
const diffBtn = $('#diffBtn');
const fileInput = $('#fileInput');
const inputStats = $('#inputStats');
const outputStats = $('#outputStats');
const statsChips = $('#statsChips');
const minifyCheck = $('#minifyCheck');
const toast = $('#toast');
const themeBtn = $('#themeBtn');
const diffModal = $('#diffModal');
const diffBody = $('#diffBody');
const diffClose = $('#diffClose');
const batchDrop = $('#batchDrop');
const batchInput = $('#batchInput');
const batchResult = $('#batchResult');

const EXT_TO_LANG = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'jsx',
  ts: 'typescript', tsx: 'tsx', java: 'java', kt: 'kotlin', kts: 'kotlin',
  swift: 'swift', c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp',
  cs: 'csharp', go: 'go', rs: 'rust', php: 'php', py: 'python', pyw: 'python',
  rb: 'ruby', sh: 'shell', bash: 'shell', zsh: 'shell', sql: 'sql',
  css: 'css', scss: 'css', sass: 'css', html: 'html', htm: 'html',
  xml: 'xml', vue: 'vue', svelte: 'svelte', yml: 'yaml', yaml: 'yaml',
  toml: 'toml', ini: 'ini', lua: 'lua', dart: 'dart',
};

const PRISM_MAP = {
  javascript: 'javascript', javascript2: 'javascript', typescript: 'typescript',
  jsx: 'jsx', tsx: 'tsx', java: 'java', kotlin: 'kotlin', swift: 'swift',
  c: 'c', cpp: 'cpp', csharp: 'csharp', cminusminus: 'c', holyc: 'c',
  go: 'go', rust: 'rust', php: 'php', python: 'python', python2: 'python',
  ruby: 'ruby', shell: 'bash', sql: 'sql', css: 'css', html: 'markup',
  xml: 'markup', yaml: 'yaml', toml: 'toml', ini: 'ini', lua: 'lua', dart: 'dart',
};

const SAMPLES = {
  javascript: `// Build metadata
const appName = "Сервер Кодеров";

/*
  Feature flags
*/
const flags = {
  beta: true, // experimental
  debug: false, // local only
};

function greet(name) {
  const message = \`Hello \${name}\`; // keep template
  return message;
}

const pattern = /https?:\\/\\/[^\\s]+/g; // URL
console.log(greet("Developer"));`,
  python: `# Скрипт приветствия
# Автор: Сервер Кодеров

"""
Многострочный docstring
"""
def greet(name):
    # Возвращает приветствие
    message = f"Hello {name}"  # f-string
    return message

print(greet("Developer"))`,
  java: `// Класс приложения
public class App {
    /*
      Точка входа
    */
    public static void main(String[] args) {
        String name = "Developer"; // имя
        System.out.println("Hello " + name);
    }
}`,
  css: `/* Глобальные стили */
:root {
  --primary: #4fd1c5; /* акцент */
}

body {
  /* фон */
  background: #0b0d10;
  color: #e7ecf3;
}`,
  html: `<!-- Верхний блок -->
<!DOCTYPE html>
<html>
<head>
  <title>Демо</title> <!-- заголовок -->
</head>
<body>
  <!-- контент -->
  <h1>Hello</h1>
</body>
</html>`,
  ruby: `# Приветствие
=begin
  Многострочный блок
=end
def greet(name)
  "Hello #{name}" # интерполяция
end

puts greet("Developer")`,
};

function showToast(message, type = '') {
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toast.className = 'toast'; }, 2400);
}

const formatNumber = (n) => n.toLocaleString('ru-RU');

function highlight() {
  if (typeof Prism === 'undefined') return;
  const lang = PRISM_MAP[languageSelect.value] || 'javascript';

  const inputText = inputCode.value;
  const prismLang = Prism.languages[lang] || Prism.languages.javascript;
  if (prismLang) inputHighlight.innerHTML = Prism.highlight(inputText, prismLang, lang);
  else inputHighlight.textContent = inputText;

  const outText = outputCode.value;
  if (prismLang) outputHighlight.innerHTML = Prism.highlight(outText, prismLang, lang);
  else outputHighlight.textContent = outText;
  syncScroll();
}

function syncScroll() {
  const iw = inputCode.parentElement;
  iw.querySelector('.highlight').scrollTop = inputCode.scrollTop;
  iw.querySelector('.highlight').scrollLeft = inputCode.scrollLeft;
  const ow = outputCode.parentElement;
  ow.querySelector('.highlight').scrollTop = outputCode.scrollTop;
  ow.querySelector('.highlight').scrollLeft = outputCode.scrollLeft;
}

inputCode.addEventListener('scroll', syncScroll);
outputCode.addEventListener('scroll', syncScroll);

function updateInputStats() {
  inputStats.textContent = `${formatNumber(inputCode.value.length)} символов`;
  removeBtn.disabled = inputCode.value.length === 0;
}

function resetOutput() {
  state.result = '';
  state.stats = null;
  outputCode.value = '';
  outputStats.textContent = '—';
  statsChips.innerHTML = '';
  copyBtn.disabled = true;
  downloadBtn.disabled = true;
  swapBtn.disabled = true;
  diffBtn.disabled = true;
  highlight();
}

function renderStats(stats) {
  outputStats.textContent = `${formatNumber(stats.after)} символов`;
  statsChips.innerHTML = `
    <span class="chip">−${stats.percent}%</span>
    <span class="chip">${formatNumber(stats.saved)} симв.</span>
    <span class="chip">${stats.linesRemoved} строковых</span>
    <span class="chip">${stats.blocksRemoved} блочных</span>
  `;
}

async function loadLanguages() {
  try {
    const res = await fetch('/.netlify/functions/remove?action=languages');
    const data = await res.json();
    state.languages = data.languages || [];
    renderLanguages(state.languages);
    const saved = localStorage.getItem('sc_lang');
    if (saved && state.languages.some((l) => l.id === saved)) {
      languageSelect.value = saved;
    }
    highlight();
  } catch {
    showToast('Не удалось загрузить языки', 'error');
  }
}

function renderLanguages(languages) {
  languageSelect.innerHTML = languages
    .map((l) => `<option value="${l.id}">${l.name}</option>`)
    .join('');
}

async function removeComments() {
  const code = inputCode.value;
  const language = languageSelect.value;
  if (!code.trim()) return;
  removeBtn.disabled = true;
  removeBtn.textContent = 'Обработка…';
  try {
    const res = await fetch('/.netlify/functions/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language, minify: minifyCheck.checked }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
    state.result = data.result;
    state.stats = data.stats;
    outputCode.value = data.result;
    renderStats(data.stats);
    copyBtn.disabled = false;
    downloadBtn.disabled = false;
    swapBtn.disabled = false;
    diffBtn.disabled = false;
    highlight();
    showToast('Комментарии удалены', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    removeBtn.disabled = inputCode.value.length === 0;
    removeBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 9h1m4 0h3"/><path d="M8 13h5"/><path d="M8 4h10a3 3 0 0 1 3 3v8c0 1.6-1.4 3-3 3h-5l-5 3v-3H8a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3"/><path d="M3 3l18 18"/></svg>
      Удалить комментарии`;
  }
}

async function copyResult() {
  if (!state.result) return;
  try {
    await navigator.clipboard.writeText(state.result);
    showToast('Скопировано', 'success');
  } catch {
    showToast('Не удалось скопировать', 'error');
  }
}

function downloadResult() {
  if (!state.result) return;
  const lang = state.languages.find((l) => l.id === languageSelect.value);
  const ext = lang?.ext || 'txt';
  const blob = new Blob([state.result], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clean-code.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Файл скачан', 'success');
}

function swapSides() {
  if (!state.result) return;
  inputCode.value = state.result;
  resetOutput();
  updateInputStats();
  showToast('Поменяли местами');
}

function openDiff() {
  if (!state.result) return;
  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(inputCode.value, state.result);
  dmp.diff_cleanupSemantic(diffs);
  let html = '';
  for (const [op, text] of diffs) {
    const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (op === 0) html += `<div class="diff-line eq"><span class="diff-prefix"> </span>${esc}</div>`;
    if (op === 1) html += `<div class="diff-line add"><span class="diff-prefix">+</span>${esc}</div>`;
    if (op === -1) html += `<div class="diff-line del"><span class="diff-prefix">−</span>${esc}</div>`;
  }
  diffBody.innerHTML = html || '<div class="muted">Изменений нет.</div>';
  diffModal.hidden = false;
}

function closeDiff() { diffModal.hidden = true; }

function clearAll() {
  inputCode.value = '';
  resetOutput();
  updateInputStats();
  showToast('Всё очищено');
}

function insertSample() {
  const lang = languageSelect.value;
  inputCode.value = SAMPLES[lang] || SAMPLES.javascript;
  updateInputStats();
  resetOutput();
  highlight();
  showToast('Пример вставлен');
}

function applyTheme() {
  const theme = localStorage.getItem('sc_theme') || 'dark';
  if (theme === 'light') {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
    themeBtn.textContent = '☀️';
  } else {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    themeBtn.textContent = '🌙';
  }
}

function toggleTheme() {
  const current = localStorage.getItem('sc_theme') || 'dark';
  localStorage.setItem('sc_theme', current === 'dark' ? 'light' : 'dark');
  applyTheme();
}

inputCode.addEventListener('input', () => {
  updateInputStats();
  if (state.result) resetOutput();
  highlight();
});

languageSelect.addEventListener('change', () => {
  localStorage.setItem('sc_lang', languageSelect.value);
  resetOutput();
  highlight();
});

inputCode.addEventListener('dragover', (e) => e.preventDefault());
inputCode.addEventListener('drop', async (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { showToast('Файл больше 2 МБ', 'error'); return; }
  inputCode.value = await file.text();
  const ext = file.name.split('.').pop().toLowerCase();
  if (EXT_TO_LANG[ext]) {
    languageSelect.value = EXT_TO_LANG[ext];
    localStorage.setItem('sc_lang', languageSelect.value);
  }
  updateInputStats();
  resetOutput();
  highlight();
  showToast(`Загружено: ${file.name}`, 'success');
});

removeBtn.addEventListener('click', removeComments);
clearBtn.addEventListener('click', clearAll);
sampleBtn.addEventListener('click', insertSample);
copyBtn.addEventListener('click', copyResult);
downloadBtn.addEventListener('click', downloadResult);
swapBtn.addEventListener('click', swapSides);
diffBtn.addEventListener('click', openDiff);
diffClose.addEventListener('click', closeDiff);
diffModal.addEventListener('click', (e) => {
  if (e.target === diffModal || e.target.classList.contains('modal-backdrop')) closeDiff();
});
themeBtn.addEventListener('click', toggleTheme);

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { showToast('Файл больше 2 МБ', 'error'); return; }
  try {
    inputCode.value = await file.text();
    const ext = file.name.split('.').pop().toLowerCase();
    if (EXT_TO_LANG[ext]) {
      languageSelect.value = EXT_TO_LANG[ext];
      localStorage.setItem('sc_lang', languageSelect.value);
    }
    updateInputStats();
    resetOutput();
    highlight();
    showToast(`Загружено: ${file.name}`, 'success');
  } catch {
    showToast('Не удалось прочитать файл', 'error');
  }
  fileInput.value = '';
});

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    if (!removeBtn.disabled) removeComments();
  }
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
    e.preventDefault();
    if (!copyBtn.disabled) copyResult();
  }
  if (e.key === 'Escape') closeDiff();
});

batchDrop.addEventListener('click', () => batchInput.click());
batchDrop.addEventListener('dragover', (e) => { e.preventDefault(); batchDrop.classList.add('drag'); });
batchDrop.addEventListener('dragleave', () => batchDrop.classList.remove('drag'));
batchDrop.addEventListener('drop', (e) => {
  e.preventDefault();
  batchDrop.classList.remove('drag');
  handleBatchFiles([...e.dataTransfer.files]);
});
batchInput.addEventListener('change', (e) => {
  handleBatchFiles([...e.target.files]);
  batchInput.value = '';
});

async function handleBatchFiles(files) {
  const valid = files.filter((f) => {
    const ext = f.name.split('.').pop().toLowerCase();
    return EXT_TO_LANG[ext] && f.size <= 500_000;
  });
  if (!valid.length) { showToast('Нет подходящих файлов', 'error'); return; }
  if (valid.length > 100) { showToast('Максимум 100 файлов', 'error'); return; }

  batchResult.innerHTML = '<div class="muted">Обработка…</div>';

  const payload = await Promise.all(
    valid.map(async (f) => ({ name: f.name, content: await f.text() }))
  );

  try {
    const res = await fetch('/.netlify/functions/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: payload }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка');

    const ok = data.files.filter((f) => f.result);
    const errs = data.files.filter((f) => f.error);
    const skips = data.files.filter((f) => f.skipped);

    let html = `<div class="batch-summary">
      <span>Файлов: <b>${data.summary.total}</b></span>
      <span>Обработано: <b>${data.summary.processed}</b></span>
      <span>Сэкономлено: <b>${formatNumber(data.summary.totalSaved)}</b> симв.</span>
    </div>`;

    html += '<div class="batch-list">';
    for (const f of ok) {
      html += `<div class="batch-item">
        <span class="batch-item-name">${f.name}</span>
        <span class="batch-item-stats">−${formatNumber(f.stats.saved)} симв · ${f.stats.linesRemoved} строковых · ${f.stats.blocksRemoved} блочных</span>
      </div>`;
    }
    for (const f of errs) {
      html += `<div class="batch-item"><span class="batch-item-name">${f.name}</span><span class="batch-item-error">${f.error}</span></div>`;
    }
    for (const f of skips) {
      html += `<div class="batch-item"><span class="batch-item-name">${f.name}</span><span class="batch-item-skip">${f.reason}</span></div>`;
    }
    html += '</div>';

    if (ok.length) {
      html += `<button id="zipBtn" class="btn primary">📦 Скачать ZIP (${ok.length} файл.)</button>`;
    }

    batchResult.innerHTML = html;

    const zipBtn = $('#zipBtn');
    if (zipBtn) {
      zipBtn.addEventListener('click', async () => {
        const zip = new JSZip();
        for (const f of ok) zip.file(f.name, f.result);
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'clean-project.zip';
        a.click();
        URL.revokeObjectURL(url);
        showToast('ZIP скачан', 'success');
      });
    }
  } catch (err) {
    batchResult.innerHTML = `<div class="batch-item-error">${err.message}</div>`;
    showToast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  loadLanguages();
  updateInputStats();
  highlight();
});

window.addEventListener('load', () => setTimeout(highlight, 100));