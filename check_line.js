const fs = require('fs');

// Читаем файл построчно
const lines = fs.readFileSync('index.js', 'utf8').split('\n');

// Показываем строки 2289-2291
console.log('Строка 2289:', JSON.stringify(lines[2289]));
console.log('Строка 2290:', JSON.stringify(lines[2290]));
console.log('Строка 2291:', JSON.stringify(lines[2291]));
