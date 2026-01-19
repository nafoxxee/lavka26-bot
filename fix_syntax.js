const fs = require('fs');

// Читаем файл
let content = fs.readFileSync('index.js', 'utf8');

// Исправляем синтаксическую ошибку - заменяем разбитую строку
content = content.replace(
    "} else if (action.startsWith('pay_p\nromo_')) {",
    "} else if (action.startsWith('pay_promo_')) {"
);

// Записываем исправленный файл
fs.writeFileSync('index.js', content, 'utf8');

console.log('Синтаксическая ошибка исправлена');
