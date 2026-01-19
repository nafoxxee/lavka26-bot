require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// Инициализация Telegram Bot
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN обязателен');
}

const bot = new TelegramBot(token);
const app = express();

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'lavka26-bot',
    timestamp: new Date().toISOString()
  });
});

// Webhook endpoint
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const webAppUrl = 'https://lavka26-miniapp.onrender.com';
  
  bot.sendMessage(chatId, '🛍️ Добро пожаловать в Lavka26!', {
    reply_markup: {
      inline_keyboard: [[{
        text: '🚀 Открыть приложение',
        web_app: { url: webAppUrl }
      }]]
    }
  });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;

// Проверяем режим работы
if (process.env.TELEGRAM_WEBHOOK_URL) {
  // Webhook режим
  app.listen(PORT, () => {
    console.log(`Бот запущен в режиме webhook на порту ${PORT}`);
    bot.setWebHook(`${process.env.TELEGRAM_WEBHOOK_URL}${token}`);
  });
} else {
  // Polling режим
  bot.setWebHook('').then(() => {
    console.log('Webhook удален, запускаем polling');
  });
  
  console.log(`Бот запущен в режиме polling`);
  
  // Запускаем сервер только для health check
  app.listen(PORT, () => {
    console.log(`Health check сервер на порту ${PORT}`);
  });
}
