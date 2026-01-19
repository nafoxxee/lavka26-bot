const { supabase } = require('../services/ads.service');

module.exports = (bot) => {
  bot.action(/^fav_(.+)/, async (ctx) => {
    const adId = ctx.match[1];
    const userId = ctx.from.id;

    const { data: existing } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('ad_id', adId)
      .single();

    if (existing) {
      return ctx.answerCbQuery('Уже в избранном');
    }

    await supabase.from('favorites').insert({
      user_id: userId,
      ad_id: adId
    });

    await ctx.answerCbQuery('❤️ Добавлено в избранное');
  });
};
