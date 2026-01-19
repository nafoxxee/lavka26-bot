const { Scenes, Markup } = require('telegraf');
const { supabase } = require('../services/ads.service');
const categories = require('../utils/categories');
const { checkText } = require('../services/moderation.service');

const FREE_LIMIT = 5;

async function checkLimit(userId) {
  const { count } = await supabase
    .from('ads')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  return count >= FREE_LIMIT;
}

const createAdScene = new Scenes.WizardScene(
  'create-ad',

  /* STEP 0 — init */
   async (ctx) => {
    ctx.wizard.state.ad = { photos: [] };

    await ctx.reply(
      '📸 Отправьте фото объявления (можно несколько).\nКогда закончите — нажмите «Далее»',
      Markup.keyboard([['➡ Далее'], ['❌ Отмена']]).resize()
    );

    return ctx.wizard.next();
  },

  /* STEP 1 — photos */
   async (ctx) => {
    if (ctx.message.text === '❌ Отмена') {
      await ctx.reply('Создание объявления отменено', Markup.removeKeyboard());
      return ctx.scene.leave();
    }

    if (ctx.message.text === '➡ Далее') {
      if (ctx.wizard.state.ad.photos.length === 0) {
        return ctx.reply('❗ Нужно добавить хотя бы одно фото');
      }

      await ctx.reply('✏ Введите название объявления:', Markup.removeKeyboard());
      return ctx.wizard.next();
    }

    if (ctx.message.photo) {
      const fileId = ctx.message.photo.at(-1).file_id;
      ctx.wizard.state.ad.photos.push(fileId);
      return ctx.reply('Фото добавлено 👍');
    }

    return ctx.reply('Отправьте фото или нажмите «Далее»');
  },


  /* STEP 2 — title *
async (ctx) => {
    ctx.wizard.state.ad.title = ctx.message.text;

    await ctx.reply('📍 Отправьте геометку',
      Markup.keyboard([
        [{ text: '📍 Отправить геометку', request_location: true }]
      ]).resize().oneTime()
    );

    return ctx.wizard.next();
  },

  /* STEP 3 — location + save */
async (ctx) => {
  if (!ctx.message.location) {
    return ctx.reply('❗ Нажмите кнопку «Отправить геометку»');
  }

  const ad = {
    user_id: ctx.from.id,
    title: ctx.wizard.state.ad.title,
    photos: ctx.wizard.state.ad.photos,
    lat: ctx.message.location.latitude,
    lon: ctx.message.location.longitude,
    status: 'pending'
  };

  const { createAd } = require('../services/ads.service');
  await createAd(ad);

  await ctx.reply(
    '⏳ Объявление отправлено на модерацию.\nВы получите уведомление после проверки.'
  );

  return ctx.scene.leave();
}

module.exports = createAdScene;
