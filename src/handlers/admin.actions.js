const { supabase } = require('../services/ads.service');
const { isAdmin } = require('../services/moderation.service');

module.exports = (bot) => {
  bot.action(/^approve_(.+)/, async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;

    const id = ctx.match[1];

    const { data: ad } = await supabase
      .from('ads')
      .update({ status: 'published' })
      .eq('id', id)
      .select()
      .single();

    await ctx.telegram.sendMediaGroup(
  process.env.CHANNEL_ID,
  ad.photos.map((p, i) => ({
    type: 'photo',
    media: p,
    caption: i === 0
      ? `📌 ${ad.title}\n💰 ${ad.price} ₽\n📂 ${ad.category}\n\n${ad.description}`
      : undefined
  }))
);

    await ctx.telegram.sendMessage(
  process.env.CHANNEL_ID,
  'Выберите действие:',
  {
    reply_markup: {
      inline_keyboard: [
        [{ text: '❤️ В избранное', callback_data: `fav_${ad.id}` }]
      ]
    }
  }
);

    await ctx.answerCbQuery('Опубликовано');
  });

  bot.action(/^reject_(.+)/, async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;

    const id = ctx.match[1];

    await supabase
      .from('ads')
      .update({ status: 'rejected' })
      .eq('id', id);

    await ctx.answerCbQuery('Отклонено');
  });
};
