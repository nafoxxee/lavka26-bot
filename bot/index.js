require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

// Инициализация Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Отсутствует конфигурация Supabase');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Инициализация Telegram Bot
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN обязателен');
}

const bot = new TelegramBot(token);
const app = express();

// Middleware
app.use(bodyParser.json());

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

// Helper functions
const getUserStats = async (telegramId) => {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, is_admin')
      .eq('telegram_id', telegramId)
      .single();

    if (userError || !user) {
      return null;
    }

    const { data: stats } = await supabase
      .rpc('get_ad_stats', { p_user_id: user.id });

    const { data: unreadChats } = await supabase
      .from('chats')
      .select(`
        messages(count, { filter: { sender_id: { neq: user.id }, is_read: { eq: false } } })
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

    const unreadCount = unreadChats?.reduce((sum, chat) => sum + (chat.messages?.length || 0), 0) || 0;

    return {
      user,
      stats,
      unreadCount
    };
  } catch (error) {
    console.error('Get user stats error:', error);
    return null;
  }
};

const sendAdminStats = async (chatId) => {
  try {
    const [
      { count: totalUsers },
      { count: totalAds },
      { count: activeAds },
      { count: pendingAds },
      { count: totalPayments }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('ads').select('*', { count: 'exact', head: true }),
      supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('payments').select('*', { count: 'exact', head: true })
    ]);

    const statsText = `
📊 *Статистика Lavka26*

👥 Пользователей: ${totalUsers}
📝 Объявлений: ${totalAds}
✅ Активных: ${activeAds}
⏳ На модерации: ${pendingAds}
💳 Платежей: ${totalPayments}
    `.trim();

    await bot.sendMessage(chatId, statsText, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Send admin stats error:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при получении статистики');
  }
};

// Bot commands
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const webAppUrl = process.env.CORS_ORIGIN || 'http://localhost:3003';
  
  const stats = await getUserStats(msg.from.id);
  const isAdmin = stats?.user?.is_admin;
  
  let welcomeText = `🛍️ *Добро пожаловать в Lavka26!*

Это маркетплейс прямо в Telegram. Покупайте и продавайте товары, общайтесь с продавцами и покупателями.

`;
  
  if (stats) {
    welcomeText += `📊 *Ваша статистика:*
• Объявлений: ${stats.stats?.total_ads || 0}
• Активных: ${stats.stats?.active_ads || 0}
• Просмотров: ${stats.stats?.total_views || 0}
• Непрочитанных: ${stats.unreadCount}

`;
  }
  
  welcomeText += `Нажмите кнопку ниже, чтобы открыть приложение:`;

  const keyboard = [[{
    text: '🛍️ Открыть Lavka26',
    web_app: { url: webAppUrl }
  }]];

  if (isAdmin) {
    keyboard.push([{
      text: '⚙️ Админ панель',
      callback_data: 'admin_panel'
    }]);
  }

  await bot.sendMessage(chatId, welcomeText, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: keyboard
    }
  });
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  
  const helpText = `🤖 *Команды бота Lavka26:*

/start - Открыть главное меню
/help - Показать эту справку
/open_app - Открыть приложение
/stats - Ваша статистика (если вы зарегистрированы)

*О проекте:*
Lavka26 - это маркетплейс в Telegram где вы можете:
• Создавать объявления
• Искать товары и услуги
• Общаться с продавцами
• Продвигать свои объявления

Для полного функционала используйте Mini App по кнопке ниже.`;

  const webAppUrl = process.env.CORS_ORIGIN || 'https://your-miniapp.vercel.app';
  
  await bot.sendMessage(chatId, helpText, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[{
        text: '🛍️ Открыть Lavka26',
        web_app: { url: webAppUrl }
      }]]
    }
  });
});

bot.onText(/\/open_app/, async (msg) => {
  const chatId = msg.chat.id;
  const webAppUrl = process.env.CORS_ORIGIN || 'https://your-miniapp.vercel.app';
  
  await bot.sendMessage(chatId, '🛍️ Открыть Lavka26:', {
    reply_markup: {
      inline_keyboard: [[{
        text: '🛍️ Открыть приложение',
        web_app: { url: webAppUrl }
      }]]
    }
  });
});

bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const stats = await getUserStats(msg.from.id);
  
  if (!stats) {
    await bot.sendMessage(chatId, '❌ Вы еще не зарегистрированы в системе. Используйте /start для регистрации.');
    return;
  }

  const statsText = `📊 *Ваша статистика:*

📝 Объявлений: ${stats.stats?.total_ads || 0}
✅ Активных: ${stats.stats?.active_ads || 0}
⏳ На модерации: ${stats.stats?.pending_ads || 0}
👀 Просмотров: ${stats.stats?.total_views || 0}
💬 Непрочитанных: ${stats.unreadCount}`;

  await bot.sendMessage(chatId, statsText, { parse_mode: 'Markdown' });
});

// Admin commands
bot.onText(/\/admin_stats/, async (msg) => {
  const stats = await getUserStats(msg.from.id);
  
  if (!stats?.user?.is_admin) {
    await bot.sendMessage(msg.chat.id, '❌ Доступ запрещен');
    return;
  }

  await sendAdminStats(msg.chat.id);
});

// Callback query handler
bot.on('callback_query', async (callbackQuery) => {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;

  if (action === 'admin_panel') {
    const stats = await getUserStats(callbackQuery.from.id);
    
    if (!stats?.user?.is_admin) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Доступ запрещен' });
      return;
    }

    const adminText = `⚙️ *Админ панель*

Выберите действие:`;

    await bot.sendMessage(chatId, adminText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📊 Статистика', callback_data: 'admin_stats' }],
          [{ text: '📝 Объявления на модерации', callback_data: 'admin_pending' }],
          [{ text: '🔙 Назад', callback_data: 'back_to_main' }]
        ]
      }
    });

    await bot.answerCallbackQuery(callbackQuery.id);
  } else if (action === 'admin_stats') {
    await sendAdminStats(chatId);
    await bot.answerCallbackQuery(callbackQuery.id);
  } else if (action === 'admin_pending') {
    try {
      const { data: pendingAds, error } = await supabase
        .from('ads')
        .select('id, title, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (!pendingAds || pendingAds.length === 0) {
        await bot.sendMessage(chatId, '✅ Нет объявлений на модерации');
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      let pendingText = `📝 *Объявления на модерации (${pendingAds.length})*\n\n`;
      
      pendingAds.forEach((ad, index) => {
        const date = new Date(ad.created_at).toLocaleDateString('ru-RU');
        pendingText += `${index + 1}. ${ad.title} (${date})\n`;
      });

      await bot.sendMessage(chatId, pendingText, { parse_mode: 'Markdown' });
      await bot.answerCallbackQuery(callbackQuery.id);
    } catch (error) {
      console.error('Get pending ads error:', error);
      await bot.sendMessage(chatId, '❌ Ошибка при получении объявлений');
      await bot.answerCallbackQuery(callbackQuery.id);
    }
  } else if (action === 'back_to_main') {
    await bot.sendMessage(chatId, '🔙 Возвращаю в главное меню...', {
      reply_markup: {
        inline_keyboard: [[{
          text: '🛍️ Открыть Lavka26',
          web_app: { url: process.env.CORS_ORIGIN || 'https://your-miniapp.vercel.app' }
        }]]
      }
    });
    await bot.answerCallbackQuery(callbackQuery.id);
  }
});

// Payment handlers
bot.on('pre_checkout_query', async (query) => {
  try {
    const { handlePreCheckoutQuery } = require('../backend/src/services/paymentService');
    await handlePreCheckoutQuery(query);
  } catch (error) {
    console.error('Pre-checkout query error:', error);
    await bot.answerPreCheckoutQuery(query.id, false, 'Payment processing error');
  }
});

bot.on('successful_payment', async (msg) => {
  try {
    const { handleSuccessfulPayment } = require('../backend/src/services/paymentService');
    await handleSuccessfulPayment(msg);
  } catch (error) {
    console.error('Successful payment handling error:', error);
  }
});

// Handle other messages
bot.on('message', async (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    await bot.sendMessage(msg.chat.id, 'Используйте команды /start, /help или /open_app для работы с приложением.');
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('Telegram polling error:', error);
});

// Express server for webhook
const PORT = process.env.PORT || 3000;

// Set webhook if webhook URL is provided
const setWebhook = async () => {
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await bot.setWebHook(`${webhookUrl}/bot${token}`);
      console.log('Webhook set successfully');
    } catch (error) {
      console.error('Error setting webhook:', error);
    }
  }
};

const deleteWebhook = async () => {
  try {
    await bot.deleteWebHook();
    console.log('Webhook deleted successfully');
  } catch (error) {
    console.error('Error deleting webhook:', error);
  }
};

// Start server
if (process.env.TELEGRAM_WEBHOOK_URL && process.env.NODE_ENV === 'production') {
  // Webhook mode (только для production)
  app.listen(PORT, async () => {
    console.log(`Bot webhook server running on port ${PORT}`);
    await setWebhook();
  });
} else {
  // Polling mode (для разработки)
  console.log('Bot started in polling mode');
  
  // Для разработки не запускаем веб-сервер
  module.exports = {
    setWebhook,
    deleteWebhook
  };
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (process.env.TELEGRAM_WEBHOOK_URL) {
    await deleteWebhook();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  if (process.env.TELEGRAM_WEBHOOK_URL) {
    await deleteWebhook();
  }
  process.exit(0);
});
