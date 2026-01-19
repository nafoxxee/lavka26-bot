const fs = require('fs');

// Читаем файл как буфер
const buffer = fs.readFileSync('index.js');

// Находим позицию строки 2290
const str = buffer.toString();
const lines = str.split('\n');

if (lines[2289]) {
    console.log('Строка 2290:');
    console.log('Текст:', JSON.stringify(lines[2289]));
    console.log('HEX байты:', Buffer.from(lines[2289], 'utf8').toString('hex'));
    
    // Проверяем каждый символ
    for (let i = 0; i < lines[2289].length; i++) {
        const char = lines[2289][i];
        const code = char.charCodeAt(0);
        console.log(`Позиция ${i}: "${char}" (${code})`);
    }
}
