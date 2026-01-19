require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN не найден!');
  process.exit(1);
}

console.log('Токен найден, запускаем бота...');

const bot = new TelegramBot(token);
const app = express();

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'test-bot' });
});

// Команда /start
bot.onText(/\/start/, (msg) => {
  console.log('Получена команда /start от:', msg.chat.id);
  
  bot.sendMessage(msg.chat.id, '🚀 Бот работает! Нажмите кнопку:', {
    reply_markup: {
      inline_keyboard: [[{
        text: '🛍️ Открыть Lavka26',
        web_app: { url: 'https://lavka26-miniapp.onrender.com' }
      }]]
    }
  });
});

// Запуск
const PORT = process.env.PORT || 3000;

// Удаляем webhook и запускаем polling
bot.setWebHook('').then(() => {
  console.log('Webhook удален, запускаем polling');
}).catch(err => {
  console.error('Ошибка удаления webhook:', err);
});

// Запускаем сервер для health check
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

console.log('Бот запущен в режиме polling');
