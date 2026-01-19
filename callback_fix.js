// Исправленная структура callback_query

bot.on('callback_query', async (ctx) => {
  const action = ctx.callbackQuery.data;
  const userId = ctx.from.id;
  const state = userStates.get(userId);
  
  if (action === 'back_to_main') {
    // Если пользователь в процессе создания, очищаем состояние
    if (state) {
      userStates.delete(userId);
    }
    const menu = ctx.from.id === ADMIN_ID ? adminMenu : mainMenu;
    await ctx.editMessageText('Выберите действие в меню ниже:');
    await ctx.reply('Выберите действие в меню ниже:', menu);
  } else if (action.startsWith('category_') && state && state.step === 'category') {
    // Выбор категории при создании объявления
    console.log('Выбрана категория:', action);
    state.data.category = action;
    state.step = 'price';
    await ctx.editMessageText('Создание объявления - Шаг 5\n\n💰 Введите цену объявления:');
    await ctx.reply('💰 Введите цену объявления:');
  } else if (action.startsWith('confirm_payment_')) {
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
  } else if (action.startsWith('reject_payment_')) {
    if (ctx.from.id !== ADMIN_ID) {
      await ctx.answerCbQuery('❌ Только для администратора');
      return;
    }
    
    const parts = action.split('_');
    const adId = parts[2];
    const userId = parts[3];
    
    try {
      // Уведомляем пользователя об отклонении
      await bot.telegram.sendMessage(userId, 
        '❌ Оплата отклонена\n\n' +
        'Пожалуйста, свяжитесь с администратором для уточнения деталей\n' +
        '@' + (ctx.from.username || 'support')
      );
      
      await ctx.editMessageText(
        '❌ Оплата отклонена\n\n' +
        'Пользователь уведомлен',
        Markup.inlineKeyboard([
          [Markup.button.callback('⬅ Назад', 'back_to_main')]
        ])
      );
      
      await ctx.answerCbQuery('❌ Оплата отклонена');
    } catch (error) {
      console.error('Ошибка отклонения оплаты:', error);
      await ctx.answerCbQuery('❌ Ошибка');
    }
  } else if (action.startsWith('pay_promo_')) {
    // Обработка оплаты рекламного объявления
    const adId = action.replace('pay_promo_', '');
    
    try {
      // Получаем реквизиты СБП
      let settings = null;
      let error = null;
      
      try {
        const result = await supabase
          .from('settings')
          .select('sbp_phone, sbp_bank')
          .eq('id', 1)
          .single();
        settings = result.data;
        error = result.error;
      } catch (e) {
        error = e;
      }

      // Используем временные данные если таблица не работает
      const phone = settings?.sbp_phone || global.tempSettings?.sbp_phone;
      const bank = settings?.sbp_bank || global.tempSettings?.sbp_bank;

      if (!phone) {
        await ctx.answerCbQuery('❌ Реквизиты СБП не настроены');
        return;
      }

      // Получаем информацию об объявлении
      const { data: ad } = await supabase
        .from('ads')
        .select('title, price')
        .eq('id', parseInt(adId))
        .single();

      if (!ad) {
        await ctx.answerCbQuery('❌ Объявление не найдено');
        return;
      }

      // Формируем ссылку для оплаты через СБП
      const sbpLink = `https://qr.nspk.ru/sbp/${bank}?bankName=${encodeURIComponent(bank)}&amount=${ad.price || 1000}&comment=${encodeURIComponent(`Реклама: ${ad.title}`)}`;
      
      let paymentText = '💳 Оплата рекламного объявления\n\n';
      paymentText += `📝 ${ad.title}\n`;
      paymentText += `💰 Сумма: ${ad.price || 1000} ₽\n\n`;
      paymentText += `📱 Реквизиты для оплаты:\n`;
      paymentText += `🏦 Банк: ${bank}\n`;
      paymentText += `📞 Телефон: ${phone}\n\n`;
      paymentText += `🔗 [Перейти к оплате](${sbpLink})\n\n`;
      paymentText += `После оплаты напишите @${ctx.from.username || 'support'} для активации`;

      await ctx.editMessageText(paymentText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            Markup.button.callback('⬅ Назад', `view_promo_${adId}`)
          ]]
        }
      });
      
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Ошибка при обработке оплаты:', error);
      await ctx.answerCbQuery('❌ Ошибка при обработке оплаты');
    }
  } else if (action.startsWith('view_promo_')) {
    // Просмотр рекламного объявления
    const adId = action.replace('view_promo_', '');
    
    try {
      const { data: ad, error } = await supabase
        .from('ads')
        .select('*')
        .eq('id', parseInt(adId))
        .single();

      if (error || !ad) {
        await ctx.answerCbQuery('❌ Объявление не найдено');
        return;
      }

      let text = `📢 Рекламное объявление\n\n`;
      text += `📝 ${ad.title}\n\n`;
      text += `${ad.description}\n\n`;
      
      if (ad.website) {
        text += `🌐 Сайт: ${ad.website}\n`;
      }
      
      if (ad.location) {
        text += `📍 [Показать на карте](https://maps.google.com/?q=${ad.location.latitude},${ad.location.longitude})\n`;
      } else if (ad.location_text) {
        text += `📍 Адрес: ${ad.location_text}\n`;
      }
      
      text += `📞 Связаться: ${ad.contact}\n`;
      text += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}`;

      const buttons = [
        [Markup.button.callback('💳 Оплатить', `pay_promo_${ad.id}`)],
        [Markup.button.callback('⬅ Назад', 'back_to_main')]
      ];

      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: buttons }
      });
      
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Ошибка при просмотре рекламного объявления:', error);
      await ctx.answerCbQuery('❌ Ошибка при загрузке объявления');
    }
  } else {
    // Если действие не распознано, просто отвечаем на callback
    try {
      await ctx.answerCbQuery();
    } catch (e) {
      // Игнорируем ошибку, если callback уже обработан
    }
  }
});
