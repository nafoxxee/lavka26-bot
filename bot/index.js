require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

console.log('Запуск бота...');

const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;

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
  res.json({ status: 'ok', service: 'webhook-bot', timestamp: new Date().toISOString() });
});

// Webhook endpoint
app.post(`/bot${token}`, (req, res) => {
  console.log('📨 Получен webhook:', req.body);
  bot.processUpdate(req.body);
  res.sendStatus(200);
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

if (webhookUrl) {
  // Webhook режим
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
    console.log(`🔗 Устанавливаем webhook: ${webhookUrl}/bot${token}`);
    
    try {
      await bot.setWebHook(`${webhookUrl}/bot${token}`);
      console.log('✅ Webhook установлен успешно');
    } catch (err) {
      console.error('❌ Ошибка установки webhook:', err);
    }
  });
  
  console.log('🚀 Бот запущен в режиме webhook');
} else {
  // Polling режим
  bot.setWebHook('').then(() => {
    console.log('✅ Webhook удален');
  }).catch(err => {
    console.error('❌ Ошибка удаления webhook:', err);
  });
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
  });
  
  console.log('🚀 Бот запущен в режиме polling');
}

console.log('📱 Ожидаю команды...');
