const fs = require('fs');

// Читаем файл как буфер
const buffer = fs.readFileSync('index.js');

// Находим позицию строки с pay_p
const str = buffer.toString();
const match = str.match(/} else if \(action\.startsWith\('pay_p[\s\S]*?romo_'\)\) {/);

if (match) {
    console.log('Найдено:', JSON.stringify(match[0]));
    console.log('Байты:', Array.from(match[0]).map(c => c.charCodeAt(0)));
} else {
    console.log('Не найдено');
}

// Показываем байты вокруг 2290 строки
const lines = str.split('\n');
if (lines[2289]) {
    console.log('Строка 2289 байты:', Array.from(lines[2289]).map(c => `${c}(${c.charCodeAt(0)})`));
}
