require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

console.log('Запуск бота...');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN не найден!');
  process.exit(1);
}

console.log('✅ Токен найден:', token.substring(0, 10) + '...');

const bot = new TelegramBot(token);
const app = express();

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'final-bot', timestamp: new Date().toISOString() });
});

// Команда /start
bot.onText(/\/start/, (msg) => {
  console.log('🎯 Получена команда /start от:', msg.chat.id);
  
  const webAppUrl = 'https://lavka26-miniapp.onrender.com';
  
  bot.sendMessage(msg.chat.id, '🛍️ Добро пожаловать в Lavka26!', {
    reply_markup: {
      inline_keyboard: [[{
        text: '🚀 Открыть приложение',
        web_app: { url: webAppUrl }
      }]]
    }
  }).then(() => {
    console.log('✅ Сообщение отправлено успешно');
  }).catch(err => {
    console.error('❌ Ошибка отправки:', err);
  });
});

// Запуск
const PORT = process.env.PORT || 3000;

// Удаляем webhook и запускаем polling
bot.setWebHook('').then(() => {
  console.log('✅ Webhook удален');
}).catch(err => {
  console.error('❌ Ошибка удаления webhook:', err);
});

// Запускаем сервер
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
});

console.log('🚀 Бот запущен в режиме polling');
console.log('📱 Ожидаю команды...');
