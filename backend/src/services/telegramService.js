const TelegramBot = require('node-telegram-bot-api');

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

const sendTelegramNotification = async (telegramId, title, message) => {
  try {
    await bot.sendMessage(telegramId, `*${title}*\n\n${message}`, {
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
};

const sendAdApprovedNotification = async (telegramId, adTitle) => {
  await sendTelegramNotification(
    telegramId,
    'Объявление одобрено',
    `Ваше объявление "${adTitle}" было одобрено и опубликовано.`
  );
};

const sendAdRejectedNotification = async (telegramId, adTitle, reason) => {
  await sendTelegramNotification(
    telegramId,
    'Объявление отклонено',
    `Ваше объявление "${adTitle}" было отклонено${reason ? `. Причина: ${reason}` : ''}.`
  );
};

const sendNewMessageNotification = async (telegramId, senderName, adTitle) => {
  await sendTelegramNotification(
    telegramId,
    'Новое сообщение',
    `Пользователь ${senderName} отправил вам сообщение по объявлению "${adTitle}"`
  );
};

const sendBoostExpiredNotification = async (telegramId, adTitle) => {
  await sendTelegramNotification(
    telegramId,
    'Поднятие объявления истекло',
    `Срок поднятия вашего объявления "${adTitle}" истек. Вы можете продлить продвижение.`
  );
};

const setupBotCommands = () => {
  bot.setMyCommands([
    { command: 'start', description: 'Начать работу с ботом' },
    { command: 'open_app', description: 'Открыть Lavka26' }
  ]);
};

const handleBotMessages = () => {
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const webAppUrl = process.env.CORS_ORIGIN || 'https://your-miniapp.vercel.app';
    
    await bot.sendMessage(chatId, 'Добро пожаловать в Lavka26 - маркетплейс в Telegram!', {
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
    
    await bot.sendMessage(chatId, 'Открыть Lavka26:', {
      reply_markup: {
        inline_keyboard: [[{
          text: '🛍️ Открыть приложение',
          web_app: { url: webAppUrl }
        }]]
      }
    });
  });

  bot.on('message', async (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
      await bot.sendMessage(msg.chat.id, 'Используйте команды /start или /open_app для работы с приложением.');
    }
  });
};

// Initialize bot
setupBotCommands();
handleBotMessages();

module.exports = {
  bot,
  sendTelegramNotification,
  sendAdApprovedNotification,
  sendAdRejectedNotification,
  sendNewMessageNotification,
  sendBoostExpiredNotification,
  setupBotCommands,
  handleBotMessages
};
