const { supabase } = require('../services/ads.service');

module.exports = (bot) => {
  bot.hears('❤️ Избранное', async (ctx) => {
    const userId = ctx.from.id;

    const { data } = await supabase
      .from('favorites')
      .select('ads(*)')
      .eq('user_id', userId);

    if (!data || data.length === 0) {
      return ctx.reply('У вас пока нет избранных объявлений');
    }

    for (const row of data) {
      const ad = row.ads;

      await ctx.replyWithPhoto(ad.photos[0], {
        caption: `📌 ${ad.title}\n💰 ${ad.price} ₽`
      });
    }
  });
};
