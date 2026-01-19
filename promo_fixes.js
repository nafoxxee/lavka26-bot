// Временный файл с исправлениями для рекламных объявлений

// 1. Добавить опцию скрытия username при создании рекламных объявлений
case 'ad_hide_username':
    if (text === '🙈 Скрыть username') {
        state.data.hide_username = true;
    } else if (text === '👤 Показать username') {
        state.data.hide_username = false;
    } else {
        await ctx.reply('❌ Пожалуйста, выберите вариант из кнопок');
        return;
    }
    
    // Завершаем создание рекламного объявления
    await publishPromoAd(ctx, await getOrCreateUser(ctx), state.data);
    userStates.delete(userId);
    break;

// 2. Исправить функцию отправки рекламного объявления в канал (убрать username если скрыто)
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
        
        // Добавляем ссылку на автора только если username не скрыт
        if (adUser && adUser.username && !ad.hide_username) {
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

// 3. Исправить обработку подтверждения оплаты (15 минут)
if (action.startsWith('confirm_payment_')) {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('❌ Только для администратора');
        return;
    }
    
    const parts = action.split('_');
    const adId = parts[2];
    const userId = parts[3];
    
    try {
      // Получаем объявление
      const { data: ad, error } = await supabase
        .from('ads')
        .select('*')
        .eq('id', adId)
        .single();
      
      if (error || !ad) {
        await ctx.answerCbQuery('❌ Объявление не найдено');
        return;
      }
      
      // Публикуем объявление
      if (CHANNEL_ID) {
        await sendPromoAdToChannel(ctx, ad);
      }
      
      // Уведомляем пользователя
      await bot.telegram.sendMessage(userId, 
        '✅ Оплата подтверждена!\n\n' +
        '🎉 Ваше рекламное объявление опубликовано в канале\n' +
        '📢 Пользователи могут связаться с вами напрямую\n\n' +
        'Спасибо за использование Lavka26! 🚀'
      );
      
      await ctx.editMessageText(
        '✅ Оплата подтверждена\n\n' +
        '📢 Объявление опубликовано в канале',
        Markup.inlineKeyboard([
          [Markup.button.callback('⬅ Назад', 'back_to_main')]
        ])
      );
      
      await ctx.answerCbQuery('✅ Оплата подтверждена');
    } catch (error) {
      console.error('Ошибка подтверждения оплаты:', error);
      await ctx.answerCbQuery('❌ Ошибка');
    }
  }
