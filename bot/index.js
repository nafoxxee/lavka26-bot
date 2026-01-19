require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

console.log('🚀 Запуск бота для Render + Vercel...');

const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
const vercelApiUrl = process.env.VERCEL_API_URL;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN не найден!');
  process.exit(1);
}

console.log('✅ Токен найден:', token.substring(0, 10) + '...');
console.log('🔗 Vercel API:', vercelApiUrl);

const bot = new TelegramBot(token);
const app = express();

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'render-bot', 
    vercel_api: vercelApiUrl,
    timestamp: new Date().toISOString() 
  });
});

// Webhook endpoint
app.post(`/bot${token}`, (req, res) => {
  console.log('📨 Получен webhook:', req.body);
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Команда /start
bot.onText(/\/start/, async (msg) => {
  console.log('🎯 Получена команда /start от:', msg.chat.id);
  
  // URL Mini App на Vercel
  const webAppUrl = process.env.VERCEL_URL || 'https://lavka26.vercel.app';
  
  try {
    await bot.sendMessage(msg.chat.id, '🛍️ Добро пожаловать в Lavka26!', {
      reply_markup: {
        inline_keyboard: [[{
          text: '🚀 Открыть приложение',
          web_app: { url: webAppUrl }
        }]]
      }
    });
    console.log('✅ Сообщение отправлено успешно');
  } catch (err) {
    console.error('❌ Ошибка отправки:', err);
  }
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
  console.log('❌ Webhook URL не найден!');
}

console.log('📱 Ожидаю команды...');
