const fs = require('fs');

// Читаем файл
const content = fs.readFileSync('index.js', 'utf8');

// Ищем проблемную строку
const lines = content.split('\n');
const problemLine = lines.find((line, index) => 
    line.includes('pay_p') && line.includes('romo')
);

console.log('Проблемная строка:', JSON.stringify(problemLine));

// Показываем контекст вокруг строки 2290
for (let i = 2285; i <= 2295; i++) {
    if (lines[i]) {
        console.log(`Строка ${i}:`, JSON.stringify(lines[i]));
    }
}
