const $ = (sel) => document.querySelector(sel);

const state = { result: '', stats: null };

const inputCode = $('#inputCode');
const outputCode = $('#outputCode');
const languageSelect = $('#languageSelect');
const removeBtn = $('#removeBtn');
const clearBtn = $('#clearBtn');
const sampleBtn = $('#sampleBtn');
const copyBtn = $('#copyBtn');
const downloadBtn = $('#downloadBtn');
const fileInput = $('#fileInput');
const inputStats = $('#inputStats');
const outputStats = $('#outputStats');
const statsChips = $('#statsChips');
const langGrid = $('#langGrid');
const toast = $('#toast');

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
}

function renderStats(stats) {
  outputStats.textContent = `${formatNumber(stats.after)} символов`;
  statsChips.innerHTML = `
    <span class="chip">−${stats.percent}%</span>
    <span class="chip">${formatNumber(stats.saved)} симв. удалено</span>
    <span class="chip">${stats.commentsRemoved} комм.</span>
  `;
}

async function loadLanguages() {
  try {
    const res = await fetch('/api/languages');
    const data = await res.json();
    renderLanguages(data.languages || []);
  } catch {
    showToast('Не удалось загрузить языки', 'error');
  }
}

function renderLanguages(languages) {
  languageSelect.innerHTML = languages
    .map((l) => `<option value="${l.id}">${l.name}</option>`)
    .join('');

  langGrid.innerHTML = languages
    .map((l) => `<div class="lang-card" data-lang="${l.id}">${l.name}</div>`)
    .join('');

  langGrid.querySelectorAll('.lang-card').forEach((card) => {
    card.addEventListener('click', () => {
      languageSelect.value = card.dataset.lang;
      document.getElementById('tool').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

async function removeComments() {
  const code = inputCode.value;
  const language = languageSelect.value;
  if (!code.trim()) return;

  removeBtn.disabled = true;
  removeBtn.textContent = 'Обработка…';

  try {
    const res = await fetch('/api/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка сервера');

    state.result = data.result;
    state.stats = data.stats;
    outputCode.value = data.result;
    renderStats(data.stats);
    copyBtn.disabled = false;
    downloadBtn.disabled = false;
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
    showToast('Скопировано в буфер обмена', 'success');
  } catch {
    showToast('Не удалось скопировать', 'error');
  }
}

function downloadResult() {
  if (!state.result) return;
  const ext = {
    javascript: 'js', typescript: 'ts', jsx: 'jsx', java: 'java', kotlin: 'kt',
    swift: 'swift', c: 'c', cpp: 'cpp', csharp: 'cs', cminusminus: 'c--',
    holyc: 'hc', go: 'go', rust: 'rs', php: 'php', python: 'py', ruby: 'rb',
    shell: 'sh', sql: 'sql', css: 'css', html: 'html', xml: 'xml', yaml: 'yml',
    toml: 'toml', ini: 'ini', lua: 'lua', dart: 'dart',
  }[languageSelect.value] || 'txt';

  const blob = new Blob([state.result], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clean-code.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Файл скачан', 'success');
}

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
  showToast('Пример вставлен');
}

inputCode.addEventListener('input', () => {
  updateInputStats();
  if (state.result) resetOutput();
});

languageSelect.addEventListener('change', () => {
  if (inputCode.value.trim() && !state.result) return;
  resetOutput();
});

removeBtn.addEventListener('click', removeComments);
clearBtn.addEventListener('click', clearAll);
sampleBtn.addEventListener('click', insertSample);
copyBtn.addEventListener('click', copyResult);
downloadBtn.addEventListener('click', downloadResult);

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    showToast('Файл больше 2 МБ', 'error');
    return;
  }
  try {
    inputCode.value = await file.text();
    updateInputStats();
    resetOutput();
    showToast(`Загружено: ${file.name}`, 'success');
  } catch {
    showToast('Не удалось прочитать файл', 'error');
  }
  fileInput.value = '';
});

document.addEventListener('DOMContentLoaded', () => {
  loadLanguages();
  updateInputStats();
});