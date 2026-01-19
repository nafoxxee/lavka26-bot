// Временный файл для создания функции sendPromoAdToChannel

async function sendPromoAdToChannel(ctx, ad) {
    try {
        // Получаем информацию о пользователе для ссылки
        const { data: adUser } = await supabase
            .from('users')
            .select('username')
            .eq('id', ad.user_id)
            .single();

        let text = `📢 ${ad.title}\n\n`;
        text += `${ad.description}\n\n`;
        // Убираем цену для рекламных объявлений
        if (ad.website) text += `🌐 ${ad.website}\n`;
        if (ad.contact) text += `📞 ${ad.contact}\n`;
        
        // Добавляем геолокацию если есть
        if (ad.location) {
            text += `📍 [Показать на карте](https://maps.google.com/?q=${ad.location.latitude},${ad.location.longitude})\n`;
        } else if (ad.location_text) {
            text += `📍 ${ad.location_text}\n`;
        }
        
        // Добавляем ссылку на автора
        if (adUser && adUser.username) {
            text += `📞 Связаться: [Написать автору](https://t.me/${adUser.username})\n`;
        }
        
        text += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}`;

        // Кнопка для добавления в избранное
        const buttons = [
            [Markup.button.callback('❤️ Добавить в избранное', `channel_favorite_${ad.id}`)]
        ];

        // Если есть фото, отправляем как медиагруппу
        if (ad.photos && ad.photos.length > 0) {
            if (ad.photos.length === 1) {
                // Одно фото - отправляем с текстом
                await ctx.telegram.sendPhoto(CHANNEL_ID, ad.photos[0], {
                    caption: text,
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: buttons }
                });
            } else {
                // Несколько фото - отправляем как медиагруппу
                const mediaGroup = ad.photos.map((photo, index) => ({
                    type: 'photo',
                    media: photo,
                    caption: index === 0 ? text : undefined,
                    parse_mode: index === 0 ? 'Markdown' : undefined
                }));

                await ctx.telegram.sendMediaGroup(CHANNEL_ID, mediaGroup);
                
                // Отправляем кнопки отдельным сообщением
                await ctx.telegram.sendMessage(CHANNEL_ID, '❤️ Добавить в избранное', {
                    reply_markup: { inline_keyboard: buttons }
                });
            }
        } else {
            // Если нет фото, отправляем только текст с кнопками
            await ctx.telegram.sendMessage(CHANNEL_ID, text, {
                disable_web_page_preview: true,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: buttons }
            });
        }

        console.log('✅ Рекламное объявление успешно отправлено в канал');
    } catch (error) {
        console.error('Ошибка отправки рекламного объявления в канал:', error);
    }
}
