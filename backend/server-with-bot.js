const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
require('dotenv').config();

const app = express();
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN не найден!');
  process.exit(1);
}

// Инициализация бота
const bot = new TelegramBot(token);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../miniapp/dist')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'unified-service', timestamp: new Date().toISOString() });
});

// Webhook для бота
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// API endpoints
app.get('/api/test', (req, res) => {
  res.json({ message: 'API работает!', timestamp: new Date().toISOString() });
});

// Обработчик команд бота
bot.onText(/\/start/, (msg) => {
  console.log('🎯 /start от:', msg.chat.id);
  
  bot.sendMessage(msg.chat.id, '🛍️ Добро пожаловать в Lavka26!', {
    reply_markup: {
      inline_keyboard: [[{
        text: '🚀 Открыть приложение',
        web_app: { url: process.env.BASE_URL || 'https://your-app.onrender.com' }
      }]]
    }
  });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  
  // Установка webhook
  const webhookUrl = `${process.env.BASE_URL}/bot${token}`;
  try {
    await bot.setWebHook(webhookUrl);
    console.log('✅ Webhook установлен:', webhookUrl);
  } catch (err) {
    console.error('❌ Ошибка webhook:', err);
  }
});

console.log('📱 Единый сервис запущен!');
