const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports.supabase = supabase;

module.exports.countUserAds = async (telegram_id) => {
  const { count } = await supabase
    .from('ads')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', telegram_id);
  return count || 0;
};

module.exports.createDraftAd = async (user, ad) => {
  const { data } = await supabase
    .from('ads')
    .insert({
      user_id: user.id,
      title: ad.title,
      description: ad.description,
      category: ad.category,
      price: ad.price,
      photos: ad.photos,
      location: ad.location,
      status: 'published'
    })
    .select()
    .single();
  return data.id;
};

module.exports.publishAd = async (ctx, adId, ad) => {
  const text = `
📢 ${ad.title}
📂 ${ad.category}
💰 ${ad.price} ₽
📝 ${ad.description}
📍 Местоположение: ${ad.location.latitude}, ${ad.location.longitude}
👤 @${ctx.from.username || ctx.from.first_name}
  `;
  await bot.telegram.sendPhoto(
  CHANNEL_ID,
  ad.photo,
  {
    caption:
`📢 ${ad.title}
💰 ${ad.price}
📍 ${ad.location}
📝 ${ad.description}`
  }
);

