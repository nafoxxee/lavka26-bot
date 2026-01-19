const fs = require('fs');

// Читаем файл
const lines = fs.readFileSync('index.js', 'utf8').split('\n');

// Исправляем строку 2289 если она все еще неправильная
if (lines[2289] && lines[2289].includes('pay_p') && lines[2289].includes('romo')) {
    lines[2289] = "  } else if (action.startsWith('pay_promo_')) {";
    console.log('Исправлена строка 2289');
}

// Записываем файл
const content = lines.join('\n');
fs.writeFileSync('index.js', content, 'utf8');

console.log('Файл перестроен');
