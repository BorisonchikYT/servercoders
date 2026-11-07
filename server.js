const express = require('express');
const path = require('path');
const { removeComments, supportedLanguages } = require('./server/commentRemovers');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'client')));

app.get('/api/languages', (req, res) => {
  res.json({ languages: supportedLanguages });
});

app.post('/api/remove', (req, res) => {
  const { code, language } = req.body || {};

  if (typeof code !== 'string' || typeof language !== 'string') {
    return res.status(400).json({ error: 'Поля "code" и "language" обязательны.' });
  }
  if (code.length > 2_000_000) {
    return res.status(413).json({ error: 'Слишком большой файл (макс. 2 МБ).' });
  }

  try {
    const result = removeComments(code, language);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Ошибка обработки.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Сервер Кодеров запущен: http://localhost:${PORT}`);
});