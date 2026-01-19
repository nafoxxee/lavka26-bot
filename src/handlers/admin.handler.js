const { Markup } = require('telegraf');
const { supabase } = require('../services/ads.service');
const { isAdmin } = require('../services/moderation.service');

module.exports = (bot) => {
  bot.command('moderation', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;

    const { data: ads } = await supabase
      .from('ads')
      .select('*')
      .eq('status', 'pending')
      .limit(5);

    if (!ads || ads.length === 0) {
      return ctx.reply('🟢 Нет объявлений на модерации');
    }

    for (const ad of ads) {
      await ctx.telegram.sendMediaGroup(
        ctx.chat.id,
        ad.photos.map((p, i) => ({
          type: 'photo',
          media: p,
          caption: i === 0
            ? `📌 ${ad.title}\n💰 ${ad.price} ₽\n📂 ${ad.category}\n\n${ad.description}`
            : undefined
        }))
      );

      await ctx.reply(
        'Выберите действие:',
        Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ Одобрить', `approve_${ad.id}`),
            Markup.button.callback('❌ Отклонить', `reject_${ad.id}`)
          ]
        ])
      );
    }
  });
};
