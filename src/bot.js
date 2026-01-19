const { Telegraf, Scenes, session } = require('telegraf');
require('dotenv').config();
require('./handlers/admin.handler')(bot);
require('./handlers/admin.actions')(bot);
require('./handlers/favorites.actions')(bot);
require('./handlers/favorites.handler')(bot);



// Подключаем сцену
const createAdWizard = require('./scenes/createAd.scene');

// Создаём Stage и подключаем сцену
const stage = new Scenes.Stage([createAdWizard]);
const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());
bot.use(stage.middleware());

// Главное меню
bot.start(ctx => {
  ctx.reply('👋 Добро пожаловать в Lavka26!', {
    reply_markup: {
      keyboard: [
        ['📄 Смотреть объявления', '➕ Создать объявление'],
        ['❤️ Избранное', '🔍 Поиск'],
        ['⚙ Настройки']
      ],
      resize_keyboard: true
    }
  });
});

// Команда для запуска FSM
bot.command('create', ctx => ctx.scene.enter('create-ad-wizard'));

// Можно также привязать кнопку меню
bot.hears('➕ Создать объявление', ctx => ctx.scene.enter('create-ad-wizard'));

// Запуск бота
bot.launch();
console.log('Bot started');
