const fs = require('fs');

// Читаем файл построчно
const lines = fs.readFileSync('index_backup.js', 'utf8').split('\n');

// Создаем новый файл с исправленной строкой
const newLines = lines.map((line, index) => {
    if (index === 2289) {
        return "  } else if (action.startsWith('pay_promo_')) {";
    }
    return line;
});

// Записываем новый файл
fs.writeFileSync('index.js', newLines.join('\n'), 'utf8');

console.log('Создан чистый файл с исправленной строкой');
