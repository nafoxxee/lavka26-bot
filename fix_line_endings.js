const fs = require('fs');

// Читаем файл
let content = fs.readFileSync('index.js', 'utf8');

// Заменяем Windows line endings (\r\n) на Unix (\n)
content = content.replace(/\r\n/g, '\n');

// Записываем исправленный файл
fs.writeFileSync('index.js', content, 'utf8');

console.log('Исправлены окончания строк');
