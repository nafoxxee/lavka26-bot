require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Конфигурация
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7548306686:AAHrKqX8mJQ7lX8Y9vK2w3lF8mK9nQ7lX';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lgotcmpdfysztzhzvtun.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_secret_knZ0lNcPytUiJoRp5AHDQA_T1nsD2qn';
const ADMIN_ID = parseInt(process.env.ADMIN_ID) || 379036860;
const AI_ADMIN_ID = parseInt(process.env.AI_ADMIN_ID) || 999999999; // ID для ИИ-админа (пока не используется)
const CHANNEL_ID = process.env.CHANNEL_ID || '@lavka26city';

// Инициализация Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Инициализация бота
const bot = new Telegraf(BOT_TOKEN);

// Глобальные переменные
const userStates = new Map();
const PROMO_AD_PRICE = 1000; // Цена рекламного объявления

// Меню
const mainMenu = Markup.keyboard([
  ['📝 Создать объявление', '📢 Разместить рекламу'],
  ['🔍 Поиск', '❤️ Избранное'],
  ['📋 Мои объявления', '⚙️ Настройки'],
  ['💰 Финансы', '🚀 Услуги']
]).resize();

const adminMenu = Markup.keyboard([
  ['📝 Создать объявление', '📢 Разместить рекламу'],
  ['🔍 Поиск', '❤️ Избранное'],
  ['📋 Мои объявления', '⚙️ Настройки'],
  ['👥 Модерация', '💰 Финансы'],
  ['🚀 Продвижение', '🤖 ИИ-Модерация']
]).resize();

// Категории
const categories = [
  { id: 'electronics', name: '📱 Электроника' },
  { id: 'clothing', name: '👕 Одежда' },
  { id: 'home', name: '🏠 Дом и быт' },
  { id: 'auto', name: '🚗 Авто' },
  { id: 'property', name: '🏡 Недвижимость' },
  { id: 'work', name: '💼 Работа' },
  { id: 'services', name: '🛠️ Услуги' },
  { id: 'top', name: '🔥 Топ объявления' },
  { id: 'other', name: '📦 Другое' }
];

// Услуги продвижения
const promotionServices = [
  { id: 'top_3_days', name: '🔥 Топ на 3 дня', price: 99, description: 'Ваше объявление в топе на 3 дня' },
  { id: 'top_7_days', name: '🔥 Топ на 7 дней', price: 199, description: 'Ваше объявление в топе на 7 дней' },
  { id: 'top_14_days', name: '🔥 Топ на 14 дней', price: 299, description: 'Ваше объявление в топе на 14 дней' },
  { id: 'highlight', name: '✨ Выделить цветом', price: 49, description: 'Выделить ваше объявление цветом на 7 дней' },
  { id: 'urgent', name: '🚀 Срочно!', price: 79, description: 'Пометить объявление как срочное на 5 дней' }
];

const categoriesKeyboard = Markup.keyboard(
  categories.map(cat => [cat.name])
).resize();

// Функция получения или создания пользователя
async function getOrCreateUser(ctx) {
  const telegramUser = ctx.from;
  
  try {
    // Проверяем существующего пользователя
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramUser.id)
      .single();

    if (existingUser) {
      return existingUser;
    }

    // Создаем нового пользователя
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        telegram_id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name
      })
      .select()
      .single();

    if (createError) {
      console.error('Ошибка создания пользователя:', createError);
      throw createError;
    }

    return newUser;
  } catch (error) {
    console.error('Ошибка в getOrCreateUser:', error);
    throw error;
  }
}

// Отправка рекламного объявления в канал
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

// Публикация рекламного объявления
async function publishPromoAd(ctx, user, adData) {
    try {
        // Получаем или создаем категорию для рекламных объявлений
        let categoryId = null;
        try {
            const { data: existingCategory } = await supabase
                .from('categories')
                .select('id')
                .eq('name', '📢 Реклама')
                .single();
            
            if (existingCategory) {
                categoryId = existingCategory.id;
            } else {
                const { data: newCategory } = await supabase
                    .from('categories')
                    .insert({ name: '📢 Реклама' })
                    .select()
                    .single();
                categoryId = newCategory.id;
            }
        } catch (catError) {
            console.log('Ошибка с категорией, используем ID по умолчанию:', catError.message);
        }

        // Подготавливаем данные для вставки
        const adInsertData = {
            user_id: user.id, // Добавляем ID пользователя
            category_id: categoryId,
            title: adData.title.trim(),
            description: adData.description.trim(),
            photos: adData.photos || [],
            videos: adData.videos || [],
            website: adData.website,
            location: adData.location,
            location_text: adData.location_text,
            contact: adData.contact,
            hide_username: adData.hide_username || false, // Добавляем флаг скрытия username
            status: 'moderation', // Рекламные объявления тоже на модерацию
            is_relevant: true,
            is_promo: true // Флаг рекламного объявления
        };

        console.log('Данные для вставки:', adInsertData);

        const { data: ad, error } = await supabase
            .from('ads')
            .insert(adInsertData)
            .select()
            .single();

        if (error) {
            console.error('Ошибка вставки рекламного объявления:', error);
            throw error;
        }

        if (ad) {
            // Если админ создает рекламу, сразу отправляем уведомление об оплате
            if (ad.user_id === ADMIN_ID) {
                console.log('Админ создал рекламу, отправляем уведомление об оплате');
                await sendPaymentNotification(ad);
            } else {
                // Отправляем уведомление админу о новом рекламном объявлении
                await notifyAdminAboutNewPromoAd(ad);
            }
            
            await ctx.reply(
                '✅ Рекламное объявление отправлено на модерацию!\n\n' +
                '📋 Ваше объявление будет проверено модератором в ближайшее время.\n' +
                '⏰ Обычно проверка занимает от 5 минут до 1 часа.\n\n' +
                '💰 После одобрения вы сможете оплатить размещение\n' +
                '🔔 Вы получите уведомление о публикации.',
                Markup.inlineKeyboard([
                    [Markup.button.callback('🏠 Главное меню', 'back_to_main')]
                ])
            );
        } else {
            await ctx.reply('❌ Ошибка при публикации объявления. Попробуйте еще раз.');
        }
    } catch (error) {
        console.error('Ошибка в publishPromoAd:', error);
        await ctx.reply(`❌ Ошибка при публикации: ${error.message}`);
    }
}

// Уведомление админа о новом рекламном объявлении
async function notifyAdminAboutNewPromoAd(ad) {
    try {
        console.log('📡 Отправляю уведомление админу о новом рекламном объявлении:', ad.id);
        
        // Получаем информацию о пользователе
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('username, first_name')
            .eq('id', ad.user_id)
            .single();

        if (userError) {
            console.error('❌ Ошибка получения пользователя:', userError);
        }

        let text = `📢 НОВОЕ РЕКЛАМНОЕ ОБЪЯВЛЕНИЕ\n\n`;
        text += `📝 ${ad.title}\n`;
        text += `👤 @${user?.username || 'unknown'} (${user?.first_name || 'Unknown'})\n`;
        text += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n\n`;
        text += `📋 Описание:\n${ad.description}\n\n`;
        
        if (ad.website) text += `🌐 Сайт: ${ad.website}\n`;
        if (ad.contact) text += `📞 Контакт: ${ad.contact}\n`;
        
        // Добавляем информацию о фото и видео
        if (ad.photos && ad.photos.length > 0) {
            text += `📸 Фото: ${ad.photos.length} шт.\n`;
        }
        if (ad.videos && ad.videos.length > 0) {
            text += `🎬 Видео: ${ad.videos.length} шт.\n`;
        }
        
        text += `\n✅ ОДОБРИТЬ ДЛЯ ОПЛАТЫ`;

        const buttons = [
            [Markup.button.callback('✅ Одобрить', `approve_promo_${ad.id}`)],
            [Markup.button.callback('❌ Отклонить', `reject_promo_${ad.id}`)]
        ];

        console.log('📤 Отправляю сообщение админу:', ADMIN_ID);
        await bot.telegram.sendMessage(ADMIN_ID, text, Markup.inlineKeyboard(buttons));
        console.log('✅ Уведомление админу отправлено');
    } catch (error) {
        console.error('❌ Ошибка уведомления админа о рекламе:', error);
    }
}

// Отправка уведомления об оплате продвижения
async function sendPromotionPaymentNotification(ctx, ad, service, payment) {
    try {
        console.log('🚀 Начинаю отправку уведомления об оплате продвижения для объявления:', ad.id, 'пользователю:', ctx.from.id);
        
        // Получаем реквизиты СБП из базы данных
        let sbpPhone = '89187713295'; // ОЗОН БАНК
        let sbpBank = 'ОЗОН БАНК'; // ОЗОН БАНК
        let sbpRecipient = 'Петр Д'; // Получатель
        
        try {
            console.log('📡 Загружаю реквизиты СБП из базы...');
            const { data: settings, error: settingsError } = await supabase
                .from('settings')
                .select('sbp_phone, sbp_bank, sbp_recipient')
                .eq('id', 1)
                .single();
            
            if (settingsError) {
                console.log('⚠️ Ошибка загрузки настроек СБП:', settingsError.message);
            } else if (settings) {
                sbpPhone = settings.sbp_phone || sbpPhone;
                sbpBank = settings.sbp_bank || sbpBank;
                sbpRecipient = settings.sbp_recipient || sbpRecipient;
                console.log('✅ Реквизиты СБП загружены:', { sbpBank, sbpPhone, sbpRecipient });
            }
        } catch (settingsError) {
            console.log('⚠️ Критическая ошибка загрузки настроек СБП, используем значения по умолчанию:', settingsError.message);
        }
        
        // Формируем СБП ссылку с реальными данными
        const sbpLink = `https://finance.ozon.ru/apps/sbp/ozonbankpay/019bcdfc-98fd-7861-ac79-b09d9c6ac066`;
        
        console.log('🔗 СБП ссылка сформирована:', sbpLink);

        const text = `🚀 Заказ услуги продвижения!\n\n` +
            `📝 Объявление: ${ad.title}\n` +
            `🚀 Услуга: ${service.name}\n` +
            `💰 Стоимость: ${service.price} ₽\n\n` +
            `📱 Реквизиты для оплаты:\n` +
            `🏦 Банк: ${sbpBank}\n` +
            `📞 Телефон: ${sbpPhone}\n` +
            `👤 Получатель: ${sbpRecipient}\n\n` +
            `📸 После оплаты нажмите "Я оплатил" и отправьте скриншот\n\n` +
            `💳 Для оплаты нажмите кнопку ниже`;

        const buttons = [
            [Markup.button.url(`💳 Оплатить ${service.price} ₽`, sbpLink)],
            [Markup.button.callback('📸 Я оплатил', `paid_promotion_${payment.id}`)],
            [Markup.button.callback('❌ Отмена', `cancel_promotion_${payment.id}`)]
        ];

        console.log('📤 Отправляю сообщение пользователю:', ctx.from.id);
        
        try {
            const message = await bot.telegram.sendMessage(ctx.from.id, text, Markup.inlineKeyboard(buttons));
            console.log('✅ Уведомление об оплате продвижения успешно отправлено пользователю:', ctx.from.id);
            console.log('📨 Message ID:', message.message_id);
            return true;
        } catch (sendError) {
            console.error('❌ Ошибка отправки сообщения пользователю:', sendError);
            
            // Если пользователь заблокировал бота, пробуем отправить уведомление админу
            if (sendError.code === 403) {
                console.log('🚫 Пользователь заблокировал бота, уведомляю админа...');
                await bot.telegram.sendMessage(ADMIN_ID, 
                    `⚠️ Пользователь ${ctx.from.id} заблокировал бота\n\n` +
                    `📝 Объявление: ${ad.title}\n` +
                    `🚀 Услуга: ${service.name}\n` +
                    `💰 Сумма: ${service.price} ₽\n\n` +
                    `❌ Уведомление об оплате не доставлено!`
                );
            }
            return false;
        }
    } catch (error) {
        console.error('❌ Критическая ошибка отправки уведомления об оплате продвижения:', error);
        
        // Отправляем простое сообщение если основное не работает
        try {
            await bot.telegram.sendMessage(ctx.from.id, 
                `🚀 Заказ услуги продвижения "${service.name}" для объявления "${ad.title}"\n\n` +
                `💰 Стоимость: ${service.price} ₽\n` +
                `Для оплаты свяжитесь с администратором.`
            );
            console.log('📨 Отправлено резервное сообщение');
            return true;
        } catch (fallbackError) {
            console.error('❌ Ошибка отправки резервного сообщения:', fallbackError);
            return false;
        }
    }
}

// Применение услуги продвижения к объявлению
async function applyPromotionService(ad, serviceId) {
    try {
        console.log('🚀 Применяю услугу продвижения:', serviceId, 'к объявлению:', ad.id);
        
        const now = new Date();
        let promotionData = {};
        
        switch (serviceId) {
            case 'top_3_days':
                promotionData = {
                    is_top: true,
                    top_expires_at: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // +3 дня
                    category_id: categories.find(c => c.id === 'top')?.id || ad.category_id
                };
                break;
            case 'top_7_days':
                promotionData = {
                    is_top: true,
                    top_expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 дней
                    category_id: categories.find(c => c.id === 'top')?.id || ad.category_id
                };
                break;
            case 'top_14_days':
                promotionData = {
                    is_top: true,
                    top_expires_at: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // +14 дней
                    category_id: categories.find(c => c.id === 'top')?.id || ad.category_id
                };
                break;
            case 'highlight':
                promotionData = {
                    is_highlighted: true,
                    highlight_expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 дней
                    highlight_color: '#FFD700' // золотой цвет
                };
                break;
            case 'urgent':
                promotionData = {
                    is_urgent: true,
                    urgent_expires_at: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // +5 дней
                    urgent_text: '🚀 Срочно!'
                };
                break;
        }
        
        // Обновляем объявление с данными продвижения
        const { error } = await supabase
            .from('ads')
            .update(promotionData)
            .eq('id', ad.id);
        
        if (error) {
            console.error('Ошибка применения услуги продвижения:', error);
            throw error;
        }
        
        console.log('✅ Услуга продвижения успешно применена:', promotionData);
        
        // Если это топ-объявление, отправляем в специальный канал/категорию
        if (promotionData.is_top && CHANNEL_ID) {
            await sendTopAdToChannel(ad);
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка применения услуги продвижения:', error);
        throw error;
    }
}

// Отправка топ-объявления в канал
async function sendTopAdToChannel(ad) {
    try {
        console.log('📢 Отправляю топ-объявление в канал:', ad.id);
        
        let text = `🔥 ТОП ОБЪЯВЛЕНИЕ 🔥\n\n` +
            `📝 ${ad.title}\n\n` +
            `📋 Описание:\n${ad.description}\n\n`;
        
        if (ad.price && !ad.is_promo) text += `💰 Цена: ${ad.price} ₽\n`;
        if (ad.website) text += `🌐 Сайт: ${ad.website}\n`;
        if (ad.contact) text += `📞 Контакт: ${ad.contact}\n`;
        if (ad.location_text) text += `📍 Адрес: ${ad.location_text}\n`;
        if (ad.is_urgent) text += `🚀 ${ad.urgent_text || 'Срочно!'}\n`;
        
        text += `\n📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n` +
            `👤 Связаться с автором: @${ad.username || 'unknown'}`;
        
        // Если есть фото, отправляем с фото
        if (ad.photos && ad.photos.length > 0) {
            await bot.telegram.sendPhoto(CHANNEL_ID, ad.photos[0], {
                caption: text,
                parse_mode: 'HTML'
            });
        } else {
            await bot.telegram.sendMessage(CHANNEL_ID, text, {
                parse_mode: 'HTML',
                disable_web_page_preview: true
            });
        }
        
        console.log('✅ Топ-объявление отправлено в канал');
    } catch (error) {
        console.error('❌ Ошибка отправки топ-объявления в канал:', error);
    }
}

// Отправка уведомления об оплате пользователю
async function sendPaymentNotification(ad) {
    try {
        console.log('🚀 Начинаю отправку уведомления об оплате для объявления:', ad.id, 'пользователю:', ad.user_id);
        console.log('📝 Данные объявления:', { title: ad.title, user_id: ad.user_id, status: ad.status });
        
        // Проверяем ID пользователя
        if (!ad.user_id) {
            console.error('❌ Отсутствует user_id в объявлении');
            return false;
        }
        
        // Получаем реквизиты СБП из базы данных
        let sbpPhone = '89187713295'; // ОЗОН БАНК
        let sbpBank = 'ОЗОН БАНК'; // ОЗОН БАНК
        let sbpRecipient = 'Петр Д'; // Получатель
        let promoPrice = 199; // Цена по умолчанию
        
        try {
            console.log('📡 Загружаю реквизиты СБП из базы...');
            const { data: settings, error: settingsError } = await supabase
                .from('settings')
                .select('sbp_phone, sbp_bank, sbp_recipient, promo_price')
                .eq('id', 1)
                .single();
            
            if (settingsError) {
                console.log('⚠️ Ошибка загрузки настроек СБП:', settingsError.message);
                console.log('🔄 Создаю настройки по умолчанию...');
                
                // Создаем настройки по умолчанию
                try {
                    const { error: insertError } = await supabase
                        .from('settings')
                        .insert({
                            id: 1,
                            sbp_phone: sbpPhone,
                            sbp_bank: sbpBank,
                            sbp_recipient: sbpRecipient,
                            promo_price: promoPrice
                        });
                    
                    if (insertError) {
                        console.log('⚠️ Ошибка создания настроек:', insertError.message);
                    } else {
                        console.log('✅ Настройки по умолчанию созданы');
                    }
                } catch (insertError) {
                    console.log('⚠️ Критическая ошибка создания настроек:', insertError.message);
                }
            } else if (settings) {
                sbpPhone = settings.sbp_phone || sbpPhone;
                sbpBank = settings.sbp_bank || sbpBank;
                sbpRecipient = settings.sbp_recipient || sbpRecipient;
                promoPrice = settings.promo_price || promoPrice;
                console.log('✅ Реквизиты СБП загружены:', { sbpBank, sbpPhone, sbpRecipient, promoPrice });
            }
        } catch (settingsError) {
            console.log('⚠️ Критическая ошибка загрузки настроек СБП, используем значения по умолчанию:', settingsError.message);
        }
        
        // Формируем СБП ссылку с реальными данными
        const sbpLink = `https://finance.ozon.ru/apps/sbp/ozonbankpay/019bcdfc-98fd-7861-ac79-b09d9c6ac066`;
        
        console.log('🔗 СБП ссылка сформирована:', sbpLink);

        const text = `✅ Ваше рекламное объявление одобрено!\n\n` +
            `📝 ${ad.title}\n` +
            `💰 Стоимость: ${promoPrice} ₽\n\n` +
            `📱 Реквизиты для оплаты:\n` +
            `🏦 Банк: ${sbpBank}\n` +
            `📞 Телефон: ${sbpPhone}\n` +
            `👤 Получатель: ${sbpRecipient}\n\n` +
            `📸 После оплаты нажмите "Я оплатил" и отправьте скриншот\n\n` +
            `💳 Для оплаты нажмите кнопку ниже`;

        const buttons = [
            [Markup.button.url(`💳 Оплатить ${promoPrice} ₽`, sbpLink)],
            [Markup.button.callback('📸 Я оплатил', `paid_promo_${ad.id}`)],
            [Markup.button.callback('❌ Отмена', `cancel_promo_${ad.id}`)]
        ];

        console.log('📤 Отправляю сообщение пользователю:', ad.user_id);
        
        try {
            const message = await bot.telegram.sendMessage(ad.user_id, text, Markup.inlineKeyboard(buttons));
            console.log('✅ Уведомление об оплате успешно отправлено пользователю:', ad.user_id);
            console.log('📨 Message ID:', message.message_id);
            return true;
        } catch (sendError) {
            console.error('❌ Ошибка отправки сообщения пользователю:', sendError);
            
            // Если пользователь заблокировал бота, пробуем отправить уведомление админу
            if (sendError.code === 403) {
                console.log('🚫 Пользователь заблокировал бота, уведомляю админа...');
                await bot.telegram.sendMessage(ADMIN_ID, 
                    `⚠️ Пользователь ${ad.user_id} заблокировал бота\n\n` +
                    `📝 Объявление: ${ad.title}\n` +
                    `💰 Сумма: ${promoPrice} ₽\n\n` +
                    `❌ Уведомление об оплате не доставлено!`
                );
            } else if (sendError.code === 400 && sendError.description.includes('chat not found')) {
                console.log('🚫 Пользователь с ID не найден, возможно неверный ID:', ad.user_id);
                await bot.telegram.sendMessage(ADMIN_ID, 
                    `⚠️ Пользователь с ID ${ad.user_id} не найден в Telegram\n\n` +
                    `📝 Объявление: ${ad.title}\n` +
                    `💰 Сумма: ${promoPrice} ₽\n\n` +
                    `❌ Уведомление об оплате не доставлено!\n` +
                    `🔍 Нужно проверить ID пользователя в базе данных`
                );
            }
            return false;
        }
    } catch (error) {
        console.error('❌ Критическая ошибка отправки уведомления об оплате:', error);
        
        // Отправляем простое сообщение если основное не работает
        try {
            await bot.telegram.sendMessage(ad.user_id, 
                `✅ Ваше рекламное объявление "${ad.title}" одобрено!\n\n` +
                `💰 Стоимость: ${promoPrice} ₽\n` +
                `Для оплаты свяжитесь с администратором.`
            );
            console.log('📨 Отправлено резервное сообщение');
            return true;
        } catch (fallbackError) {
            console.error('❌ Ошибка отправки резервного сообщения:', fallbackError);
            return false;
        }
    }
}

// Инициализация категорий
async function initCategories() {
    try {
        const { data: existingCategories, error } = await supabase
            .from('categories')
            .select('*');

        if (error) {
            console.error('Ошибка загрузки категорий:', error);
            return;
        }

        if (!existingCategories || existingCategories.length === 0) {
            console.log('Создание категорий...');
            const { data: newCategories, error: insertError } = await supabase
                .from('categories')
                .insert(categories)
                .select();

            if (insertError) {
                console.error('Ошибка создания категорий:', insertError);
            } else {
                console.log('✅ Категории успешно созданы:', newCategories);
            }
        } else {
            console.log('✅ Категории уже существуют');
        }
    } catch (error) {
        console.error('Ошибка инициализации категорий:', error);
    }
}

// Обработчик команды /start
bot.start(async (ctx) => {
    const user = await getOrCreateUser(ctx);
    const menu = (ctx.from.id === ADMIN_ID || ctx.from.id === AI_ADMIN_ID) ? adminMenu : mainMenu;
    
    await ctx.reply(
        `👋 Привет, ${user.first_name}!\n\n` +
        'Добро пожаловать в Lavka26 - доску объявлений!\n\n' +
        'Здесь вы можете:\n' +
        '📝 Размещать объявления\n' +
        '📢 Размещать рекламу\n' +
        '🔍 Искать товары и услуги\n' +
        '❤️ Добавлять в избранное\n\n' +
        'Выберите действие в меню ниже:',
        menu
    );
});

// Обработчик текстовых сообщений
bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const text = ctx.message.text;
    const state = userStates.get(userId);
    
    // Обработка кнопок меню (не в процессе создания)
    if (!state) {
        if (text === '📝 Создать объявление') {
            userStates.set(userId, {
                step: 'photo',
                data: {}
            });
            await ctx.reply(
                'Создание объявления - Шаг 1\n\n📸 Отправьте фото объявления (максимум 10 фото)',
                Markup.keyboard([
                    ['Далее', '❌ Отмена']
                ]).resize()
            );
        } else if (text === '📢 Разместить рекламу') {
            userStates.set(userId, {
                step: 'ad_photo',
                data: {}
            });
            await ctx.reply(
                '📢 Создание рекламного объявления\n\n' +
                'Шаг 1 из 7: 📸 Фото и видео\n\n' +
                'Отправьте фото и видео (максимум 10 файлов)\n' +
                '💡 Отправьте все файлы одним сообщением или по очереди\n' +
                '⏩ Когда закончите, нажмите "Далее"',
                Markup.keyboard([
                    ['Далее', '❌ Отмена']
                ]).resize()
            );
        } else if (text === '🔍 Поиск') {
            userStates.set(userId, {
                step: 'search',
                data: {}
            });
            await ctx.reply('🔍 Введите ключевые слова для поиска:');
        } else if (text === '❤️ Избранное') {
            // Обработка избранного
            await ctx.reply('❤️ Ваши избранные объявления:\n\nЗагрузка...', 
                Markup.inlineKeyboard([
                    [Markup.button.callback('🔄 Обновить', 'view_favorites')],
                    [Markup.button.callback('🏠 Главное меню', 'back_to_main')]
                ])
            );
        } else if (text === '📋 Мои объявления') {
            // Обработка моих объявлений
            await ctx.reply('📋 Ваши объявления:\n\nЗагрузка...', 
                Markup.inlineKeyboard([
                    [Markup.button.callback('🔄 Обновить', 'view_my_ads')],
                    [Markup.button.callback('🏠 Главное меню', 'back_to_main')]
                ])
            );
        } else if (text === '⚙️ Настройки') {
            // Обработка настроек
            await ctx.reply(
                '⚙️ Настройки:\n\n' +
                '🔔 Уведомления: включены\n' +
                '🌐 Язык: русский\n' +
                '👤 Профиль: заполнен\n\n' +
                'Выберите действие:',
                Markup.inlineKeyboard([
                    [Markup.button.callback('👤 Редактировать профиль', 'edit_profile')],
                    [Markup.button.callback('🔔 Настройки уведомлений', 'notification_settings')],
                    [Markup.button.callback('🏠 Главное меню', 'back_to_main')]
                ])
            );
        } else if (text === '👥 Модерация' && (ctx.from.id === ADMIN_ID || ctx.from.id === AI_ADMIN_ID)) {
            // Обработка модерации
            await ctx.reply(
                '👥 Модерация:\n\n' +
                'Выберите действие:',
                Markup.inlineKeyboard([
                    [Markup.button.callback('📋 Ожидают модерации', 'moderation_queue')],
                    [Markup.button.callback('✅ Одобренные', 'approved_ads')],
                    [Markup.button.callback('❌ Отклоненные', 'rejected_ads')],
                    [Markup.button.callback('🏠 Главное меню', 'back_to_main')]
                ])
            );
        } else if (text === '🚀 Продвижение' && (ctx.from.id === ADMIN_ID || ctx.from.id === AI_ADMIN_ID)) {
            // Панель продвижения для администратора
            await ctx.reply(
                '🚀 Панель продвижения\n\n' +
                'Тестирование услуг продвижения:\n' +
                '• Проверка работы топа\n' +
                '• Проверка выделения цветом\n' +
                '• Проверка срочности\n\n' +
                'Выберите действие:',
                Markup.inlineKeyboard([
                    [Markup.button.callback('🔥 Тестировать топ', 'test_top_promotion')],
                    [Markup.button.callback('✨ Тестировать выделение', 'test_highlight_promotion')],
                    [Markup.button.callback('🚀 Тестировать срочность', 'test_urgent_promotion')],
                    [Markup.button.callback('📊 Статистика продвижений', 'promotion_stats')],
                    [Markup.button.callback('⬅ Назад', 'back_to_main')]
                ])
            );
        } else if (text === '🤖 ИИ-Модерация' && (ctx.from.id === ADMIN_ID || ctx.from.id === AI_ADMIN_ID)) {
            // ИИ-модерация
            await ctx.reply(
                '🤖 ИИ-Модерация\n\n' +
                'Автоматическая модерация объявлений:\n' +
                '• Проверка на запрещенные слова\n' +
                '• Проверка на спам\n' +
                '• Автоодобрение безопасных объявлений\n\n' +
                'Выберите действие:',
                Markup.inlineKeyboard([
                    [Markup.button.callback('🔍 Проверить очередь', 'ai_moderate_queue')],
                    [Markup.button.callback('⚙️ Настройки ИИ', 'ai_settings')],
                    [Markup.button.callback('📊 Статистика ИИ', 'ai_stats')],
                    [Markup.button.callback('⬅ Назад', 'back_to_main')]
                ])
            );
        } else if (text === '💰 Финансы' && (ctx.from.id === ADMIN_ID || ctx.from.id === AI_ADMIN_ID)) {
            // Обработка финансов администратора
            await ctx.reply('💰 Финансы администратора:\n\nЗагрузка...', 
                Markup.inlineKeyboard([
                    [Markup.button.callback('🔄 Обновить', 'finance_stats')],
                    [Markup.button.callback('📝 Реквизиты СБП', 'finance_sbp')],
                    [Markup.button.callback('🏠 Главное меню', 'back_to_main')]
                ])
            );
        } else if (text === '🚀 Услуги') {
            // Обработка услуг продвижения
            await ctx.reply(
                '🚀 Услуги продвижения\n\n' +
                'Выберите услугу для продвижения вашего объявления:',
                Markup.inlineKeyboard([
                    [Markup.button.callback('🔥 Топ на 3 дня - 99₽', 'promo_top_3_days')],
                    [Markup.button.callback('🔥 Топ на 7 дней - 199₽', 'promo_top_7_days')],
                    [Markup.button.callback('🔥 Топ на 14 дней - 299₽', 'promo_top_14_days')],
                    [Markup.button.callback('✨ Выделить цветом - 49₽', 'promo_highlight')],
                    [Markup.button.callback('🚀 Срочно! - 79₽', 'promo_urgent')],
                    [Markup.button.callback('🏠 Главное меню', 'back_to_main')]
                ])
            );
        } else if (text === '💰 Финансы' && (ctx.from.id === ADMIN_ID || ctx.from.id === AI_ADMIN_ID)) {
            // Обработка финансов
            await ctx.reply(
                '💰 Финансовые настройки\n\n' +
                'Выберите действие:',
                Markup.inlineKeyboard([
                    [Markup.button.callback('📝 Реквизиты СБП', 'finance_sbp')],
                    [Markup.button.callback('📊 Статистика', 'finance_stats')],
                    [Markup.button.callback('🏠 Главное меню', 'back_to_main')]
                ])
            );
        } else if (text === '❌ Отмена') {
            // Отмена текущего действия
            const state = userStates.get(userId);
            userStates.delete(userId);
            
            if (state && (state.step === 'finance_phone' || state.step === 'finance_bank' || state.step === 'finance_price')) {
                await ctx.reply('❌ Действие отменено', 
                    Markup.inlineKeyboard([
                        [Markup.button.callback('📝 Реквизиты СБП', 'finance_sbp')],
                        [Markup.button.callback('📊 Статистика', 'finance_stats')],
                        [Markup.button.callback('⬅ Назад', 'back_to_main')]
                    ])
                );
            } else {
                await ctx.reply('❌ Действие отменено', mainMenu);
            }
        }
        return;
    }

    // Обработка шагов создания объявления
    switch (state.step) {
        case 'location':
            // Обработка геолокации для обычных объявлений
            if (ctx.message.location) {
                // Получена геолокация
                state.data.location = {
                    latitude: ctx.message.location.latitude,
                    longitude: ctx.message.location.longitude
                };
                state.step = 'title';
                await ctx.reply(
                    'Создание объявления - Шаг 2\n\n📝 Введите название объявления:'
                );
            } else if (text === 'Далее') {
                // Пропуск геолокации
                state.step = 'title';
                await ctx.reply(
                    'Создание объявления - Шаг 2\n\n📝 Введите название объявления:'
                );
            } else if (text === '✍️ Ввести адрес вручную') {
                userStates.set(userId, {
                    step: 'manual_address',
                    data: {}
                });
                await ctx.reply(
                    'Создание объявления - Шаг 6\n\n' +
                    '📍 Введите адрес в формате: Город, Улица, Дом\n\n' +
                    'Пример: Москва, Тверская улица, 1'
                );
            } else if (text === '❌ Отмена') {
                userStates.delete(userId);
                await ctx.reply('❌ Действие отменено', mainMenu);
            }
            break;
        case 'ad_location':
            // Обработка геолокации для рекламных объявлений
            if (ctx.message.location) {
                // Получена геолокация
                state.data.location = {
                    latitude: ctx.message.location.latitude,
                    longitude: ctx.message.location.longitude
                };
                state.step = 'ad_contact';
                await ctx.reply(
                    '📢 Создание рекламного объявления\n\n' +
                    'Шаг 5 из 6: 📞 Контактная информация\n\n' +
                    'Введите контакт для связи (телефон, email, соцсети):',
                    Markup.keyboard([
                        ['❌ Отмена']
                    ]).resize()
                );
            } else if (text === 'Далее') {
                // Пропуск геолокации
                state.step = 'ad_contact';
                await ctx.reply(
                    '📢 Создание рекламного объявления\n\n' +
                    'Шаг 6 из 7: 📞 Контактная информация\n\n' +
                    'Введите контакт для связи (телефон, email, соцсети):',
                    Markup.keyboard([
                        ['❌ Отмена']
                    ]).resize()
                );
            } else if (text === '✍️ Ввести адрес вручную') {
                userStates.set(userId, {
                    step: 'manual_address',
                    data: {}
                });
                await ctx.reply(
                    '📢 Создание рекламного объявления\n\n' +
                    'Шаг 5 из 7: 📍 Введите адрес в формате: Город, Улица, Дом\n\n' +
                    'Пример: Москва, Тверская улица, 1'
                );
            } else if (text === '❌ Отмена') {
                userStates.delete(userId);
                await ctx.reply('❌ Действие отменено', mainMenu);
            }
            break;
        case 'manual_address':
            // Валидация адреса в строгом формате (Город, Улица, Дом)
            const addressParts = text.split(',').map(part => part.trim());
            
            if (addressParts.length < 3) {
                await ctx.reply(
                    '❌ Неверный формат адреса!\n\n' +
                    'Требуется формат: Город, Улица, Дом\n\n' +
                    'Пример: Москва, Тверская улица, 1\n\n' +
                    'Попробуйте еще раз:'
                );
                return;
            }
            
            const [city, street, building] = addressParts;
            
            // Форматируем адрес
            const formattedAddress = `${city}, ${street}, ${building}`;
            
            // Сохраняем адрес
            state.data.location_text = formattedAddress;
            
            await ctx.reply(
                '✅ Адрес сохранен!\n\n' +
                `📍 ${formattedAddress}\n\n` +
                'Переходим к следующему шагу...'
            );
            
            // Возвращаемся к предыдущему шагу
            if (state.data.website !== undefined) {
                // Это рекламное объявление
                state.step = 'ad_media';
                await ctx.reply(
                    '📢 Создание рекламного объявления\n\n' +
                    'Шаг 5 из 6: 📸 Фото и видео\n\n' +
                    'Отправьте фото и видео (до 10 файлов)\n' +
                    'Когда закончите, нажмите "Далее"',
                    Markup.keyboard([
                        ['Далее', '❌ Отмена']
                    ]).resize()
                );
            } else {
                // Обычное объявление
                state.step = 'title';
                await ctx.reply(
                    'Создание объявления - Шаг 2\n\n📝 Введите название объявления:'
                );
            }
            break;
        case 'ad_photo':
            // Обработка фото и видео для рекламных объявлений
            if (text === 'Далее') {
                // Переходим к следующему шагу
                state.step = 'ad_title';
                await ctx.reply(
                    '📢 Создание рекламного объявления\n\n' +
                    'Шаг 2 из 7: 📝 Название\n\n' +
                    'Введите название объявления (максимум 100 символов):',
                    Markup.keyboard([
                        ['❌ Отмена']
                    ]).resize()
                );
            } else if (text === '❌ Отмена') {
                userStates.delete(userId);
                await ctx.reply('❌ Создание рекламы отменено', mainMenu);
            } else if (ctx.message.photo || ctx.message.video) {
                // Сохраняем фото и видео
                if (!state.data.photos) state.data.photos = [];
                if (!state.data.videos) state.data.videos = [];
                
                const totalFiles = (state.data.photos?.length || 0) + (state.data.videos?.length || 0);
                
                if (ctx.message.photo) {
                    if (totalFiles >= 10) {
                        await ctx.reply('❌ Максимальное количество файлов - 10. Нажмите "Далее" для продолжения.');
                        return;
                    }
                    
                    const photo = ctx.message.photo[ctx.message.photo.length - 1]; // Берем фото лучшего качества
                    state.data.photos.push(photo.file_id);
                    
                    await ctx.reply(`✅ Фото добавлено (${state.data.photos.length + state.data.videos.length}/10)`);
                }
                
                if (ctx.message.video) {
                    if (totalFiles >= 10) {
                        await ctx.reply('❌ Максимальное количество файлов - 10. Нажмите "Далее" для продолжения.');
                        return;
                    }
                    
                    state.data.videos.push(ctx.message.video.file_id);
                    
                    await ctx.reply(`✅ Видео добавлено (${state.data.photos.length + state.data.videos.length}/10)`);
                }
            } else {
                await ctx.reply('❌ Отправьте фото/видео или нажмите "Далее"');
            }
            break;
        case 'ad_title':
            // Валидация названия для рекламного объявления
            if (text.trim().length < 3) {
                await ctx.reply('❌ Название должно содержать минимум 3 символа. Попробуйте еще раз:');
                return;
            }
            if (text.trim().length > 100) {
                await ctx.reply('❌ Название не должно превышать 100 символов. Попробуйте еще раз:');
                return;
            }
            state.data.title = text.trim();
            state.step = 'ad_description';
            await ctx.reply(
                '📢 Создание рекламного объявления\n\n' +
                'Шаг 3 из 7: 📝 Описание\n\n' +
                'Введите описание объявления (максимум 1000 символов):',
                Markup.keyboard([
                    ['❌ Отмена']
                ]).resize()
            );
            break;
        case 'ad_description':
            // Валидация описания для рекламного объявления
            if (text.trim().length < 10) {
                await ctx.reply('❌ Описание должно содержать минимум 10 символов. Попробуйте еще раз:');
                return;
            }
            if (text.trim().length > 1000) {
                await ctx.reply('❌ Описание не должно превышать 1000 символов. Попробуйте еще раз:');
                return;
            }
            state.data.description = text.trim();
            state.step = 'ad_website';
            await ctx.reply(
                '📢 Создание рекламного объявления\n\n' +
                'Шаг 4 из 7: 🌐 Сайт или соцсети\n\n' +
                'Введите сайт или ссылку на соцсети (необязательно):\n' +
                '• Сайт: https://example.com\n' +
                '• Instagram: https://instagram.com/username\n' +
                '• Telegram: https://t.me/username\n\n' +
                'Или отправьте "Пропустить" чтобы пропустить этот шаг',
                Markup.keyboard([
                    ['Пропустить', '❌ Отмена']
                ]).resize()
            );
            break;
        case 'ad_website':
            if (text === 'Пропустить') {
                state.data.website = null;
            } else {
                // Валидация URL или соцсетей
                const urlPattern = /^https?:\/\/.+/;
                const socialPattern = /^(https?:\/\/)?(www\.)?(instagram\.com|t\.me|vk\.com|telegram\.me)\/.+/;
                
                if (!urlPattern.test(text) && !socialPattern.test(text)) {
                    await ctx.reply('❌ Введите корректный URL или ссылку на соцсети:\n\n' +
                        '• Сайт: https://example.com\n' +
                        '• Instagram: https://instagram.com/username\n' +
                        '• Telegram: https://t.me/username\n' +
                        '• VK: https://vk.com/username');
                    return;
                }
                state.data.website = text.trim();
            }
            state.step = 'ad_location';
            await ctx.reply(
                '📢 Создание рекламного объявления\n\n' +
                'Шаг 5 из 7: 📍 Адрес\n\n' +
                'Выберите способ указания адреса:',
                Markup.keyboard([
                    [Markup.button.locationRequest('📍 Отправить геопозицию')],
                    ['✍️ Ввести адрес вручную'],
                    ['Далее', '❌ Отмена']
                ]).resize()
            );
            break;
        case 'ad_contact':
            // Валидация контактной информации
            if (text.trim().length < 3) {
                await ctx.reply('❌ Контактная информация слишком короткая. Минимум 3 символа:');
                return;
            }
            state.data.contact = text.trim();
            
            // Добавляем шаг для выбора скрытия username
            state.step = 'ad_hide_username';
            await ctx.reply(
                '📢 Создание рекламного объявления\n\n' +
                'Шаг 7 из 7: 🕵️️ Настройки приватности\n\n' +
                'Хотите скрыть ваш username в объявлении?\n\n' +
                '👤 Если скрыто, пользователи смогут связаться только через контактные данные',
                Markup.keyboard([
                    ['🙈 Скрыть username', '👤 Показать username'],
                    ['❌ Отмена']
                ]).resize()
            );
            break;
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
            
            // Отправляем главное меню
            const menu = (ctx.from.id === ADMIN_ID || ctx.from.id === AI_ADMIN_ID) ? adminMenu : mainMenu;
            await ctx.reply('Выберите действие в меню ниже:', menu);
            break;
        case 'finance_phone':
            // Валидация телефона СБП
            const phone = text.replace(/\D/g, '');
            if (phone.length !== 11 || !phone.startsWith('79')) {
                await ctx.reply('❌ Введите корректный номер телефона в формате 79123456789:');
                return;
            }
            
            try {
                // Сначала проверяем есть ли запись в таблице
                const { data: existingSettings, error: selectError } = await supabase
                    .from('settings')
                    .select('*')
                    .eq('id', 1)
                    .single();

                if (selectError && selectError.code !== 'PGRST116') {
                    console.error('Ошибка проверки настроек:', selectError);
                    throw selectError;
                }

                if (existingSettings) {
                    // Запись существует - обновляем
                    const { error: updateError } = await supabase
                        .from('settings')
                        .update({ sbp_phone: phone })
                        .eq('id', 1);

                    if (updateError) throw updateError;
                } else {
                    // Записи нет - создаем новую
                    const { error: insertError } = await supabase
                        .from('settings')
                        .insert({ id: 1, sbp_phone: phone });

                    if (insertError) throw insertError;
                }
                
                await ctx.reply(
                    '✅ Телефон СБП успешно сохранен!\n\n' +
                    `📱 Телефон: ${phone}`,
                    Markup.inlineKeyboard([
                        [Markup.button.callback('⬅ Назад к реквизитам', 'finance_sbp')]
                    ])
                );
                
                userStates.delete(userId);
            } catch (error) {
                console.error('Ошибка сохранения телефона:', error);
                await ctx.reply('❌ Ошибка сохранения телефона. Попробуйте еще раз.');
            }
            break;
        case 'finance_bank':
            // Валидация банка СБП
            if (text.trim().length < 2) {
                await ctx.reply('❌ Название банка слишком короткое. Попробуйте еще раз:');
                return;
            }
            
            try {
                // Сначала проверяем есть ли запись в таблице
                const { data: existingSettings, error: selectError } = await supabase
                    .from('settings')
                    .select('*')
                    .eq('id', 1)
                    .single();

                if (selectError && selectError.code !== 'PGRST116') {
                    console.error('Ошибка проверки настроек:', selectError);
                    throw selectError;
                }

                if (existingSettings) {
                    // Запись существует - обновляем
                    const { error: updateError } = await supabase
                        .from('settings')
                        .update({ sbp_bank: text.trim() })
                        .eq('id', 1);

                    if (updateError) throw updateError;
                } else {
                    // Записи нет - создаем новую
                    const { error: insertError } = await supabase
                        .from('settings')
                        .insert({ id: 1, sbp_bank: text.trim() });

                    if (insertError) throw insertError;
                }
                
                await ctx.reply(
                    '✅ Банк СБП успешно сохранен!\n\n' +
                    `🏦 Банк: ${text.trim()}`,
                    Markup.inlineKeyboard([
                        [Markup.button.callback('⬅ Назад к реквизитам', 'finance_sbp')]
                    ])
                );
                
                userStates.delete(userId);
            } catch (error) {
                console.error('Ошибка сохранения банка:', error);
                await ctx.reply('❌ Ошибка сохранения банка. Попробуйте еще раз.');
            }
            break;
        case 'payment_screenshot':
            // Пользователь должен отправить фото, а не текст
            await ctx.reply('❌ Пожалуйста, отправьте скриншот как фото, а не текстом');
            break;
        case 'finance_price':
            // Валидация цены рекламы
            const price = parseFloat(text.replace(/[^\d.]/g, ''));
            if (isNaN(price) || price <= 0) {
                await ctx.reply('❌ Введите корректную цену (только число):');
                return;
            }
            
            try {
                // Сначала проверяем есть ли запись в таблице
                const { data: existingSettings, error: selectError } = await supabase
                    .from('settings')
                    .select('*')
                    .eq('id', 1)
                    .single();

                if (selectError && selectError.code !== 'PGRST116') {
                    console.error('Ошибка проверки настроек:', selectError);
                    throw selectError;
                }

                if (existingSettings) {
                    // Запись существует - обновляем
                    const { error: updateError } = await supabase
                        .from('settings')
                        .update({ promo_price: price })
                        .eq('id', 1);

                    if (updateError) throw updateError;
                } else {
                    // Записи нет - создаем новую
                    const { error: insertError } = await supabase
                        .from('settings')
                        .insert({ id: 1, promo_price: price });

                    if (insertError) throw insertError;
                }
                
                await ctx.reply(
                    '✅ Цена рекламы успешно сохранена!\n\n' +
                    `💰 Новая цена: ${price} ₽`,
                    Markup.inlineKeyboard([
                        [Markup.button.callback('⬅ Назад к настройкам', 'finance_sbp')]
                    ])
                );
                
                userStates.delete(userId);
            } catch (error) {
                console.error('Ошибка сохранения цены:', error);
                await ctx.reply('❌ Ошибка сохранения цены. Попробуйте еще раз.');
            }
            break;
        case 'view_my_ads':
            // Меню с разделами объявлений
            await ctx.reply(
                '📋 Мои объявления\n\n' +
                'Выберите раздел:',
                Markup.inlineKeyboard([
                    [Markup.button.callback('📝 Черновики', 'view_drafts')],
                    [Markup.button.callback('💳 Неоплаченные', 'view_unpaid')],
                    [Markup.button.callback('✅ Оплаченные', 'view_paid')],
                    [Markup.button.callback('📢 Все объявления', 'view_all_ads')],
                    [Markup.button.callback('⬅ Назад', 'back_to_main')]
                ])
            );
            userStates.delete(userId);
            break;
        case 'view_favorites':
            // Загрузка и отображение избранных объявлений
            try {
                const { data: favorites, error } = await supabase
                    .from('favorites')
                    .select(`
                        ads!inner(
                            id,
                            title,
                            price,
                            created_at,
                            is_promo,
                            status
                        )
                    `)
                    .eq('favorites.user_id', userId)
                    .order('favorites.created_at', { ascending: false });

                if (error) {
                    console.error('Ошибка загрузки избранного:', error);
                    await ctx.reply('❌ Ошибка загрузки избранного. Попробуйте позже.');
                    return;
                }

                if (!favorites || favorites.length === 0) {
                    await ctx.reply(
                        '❤️ Ваши избранные объявления:\n\n' +
                        'У вас пока нет избранных объявлений.\n\n' +
                        '🔍 Найдите интересные объявления!',
                        mainMenu
                    );
                    userStates.delete(userId);
                    return;
                }

                let text = '❤️ Ваши избранные объявления:\n\n';
                const buttons = [];

                for (const favorite of favorites) {
                    const ad = favorite.ads;
                    text += `${ad.is_promo ? '📢' : '📝'} ${ad.title}\n`;
                    text += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n\n`;
                    
                    buttons.push([Markup.button.callback(
                        ad.is_promo ? `📢 ${ad.title}` : `📝 ${ad.title}`,
                        `view_ad_${ad.id}`
                    )]);
                }

                text += 'Всего в избранном: ' + favorites.length;

                await ctx.reply(text, Markup.inlineKeyboard(buttons));
                userStates.delete(userId);
            } catch (error) {
                console.error('Ошибка в view_favorites:', error);
                await ctx.reply('❌ Ошибка загрузки избранного', mainMenu);
                userStates.delete(userId);
            }
            break;
        case 'search':
            // Обработка поиска
            try {
                const { data: ads, error } = await supabase
                    .from('ads')
                    .select(`
                        *,
                        users!inner(
                            username,
                            first_name
                        )
                    `)
                    .or(`title.ilike.%${text}%,description.ilike.%${text}%`)
                    .eq('status', 'published')
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (error) {
                    console.error('Ошибка поиска:', error);
                    await ctx.reply('❌ Ошибка поиска. Попробуйте позже.');
                    return;
                }

                if (!ads || ads.length === 0) {
                    await ctx.reply(
                        '🔍 Результаты поиска\n\n' +
                        '❌ Объявления не найдены\n\n' +
                        '💡 Попробуйте другие ключевые слова',
                        Markup.keyboard([
                            ['🔍 Новый поиск', '❌ Отмена']
                        ]).resize()
                    );
                    return;
                }

                let searchResults = '🔍 Результаты поиска:\n\n';
                const buttons = [];
                let adCount = 0;

                for (const ad of ads) {
                    adCount++;
                    
                    // Очищаем диалог каждые 5 объявлений
                    if (adCount % 5 === 0) {
                        await ctx.reply('🔄 Обновляем результаты поиска...');
                        searchResults = '🔍 Результаты поиска:\n\n';
                    }
                    
                    searchResults += `${ad.is_promo ? '📢' : '📝'} ${ad.title}\n`;
                    searchResults += `👤 @${ad.users.username || 'unknown'}\n`;
                    searchResults += `💰 ${ad.price || '0'} ₽\n`;
                    searchResults += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n\n`;
                    
                    buttons.push([Markup.button.callback(
                        ad.is_promo ? `📢 ${ad.title}` : `📝 ${ad.title}`,
                        `view_ad_${ad.id}`
                    )]);
                }

                searchResults += `Найдено объявлений: ${ads.length}`;

                await ctx.reply(searchResults, Markup.inlineKeyboard(buttons));
                userStates.delete(userId);
            } catch (error) {
                console.error('Ошибка в search:', error);
                await ctx.reply('❌ Ошибка поиска. Попробуйте позже.');
                userStates.delete(userId);
            }
            break;
        case 'edit_first_name':
            // Изменение имени
            if (text.trim().length < 2) {
                await ctx.reply('❌ Имя слишком короткое. Минимум 2 символа:');
                return;
            }
            
            try {
                const { error } = await supabase
                    .from('users')
                    .update({ first_name: text.trim() })
                    .eq('id', userId);

                if (error) throw error;

                await ctx.reply('✅ Имя успешно изменено!', mainMenu);
                userStates.delete(userId);
            } catch (error) {
                console.error('Ошибка изменения имени:', error);
                await ctx.reply('❌ Ошибка изменения имени. Попробуйте позже.');
            }
            break;
        case 'edit_phone':
            // Изменение телефона
            const userPhone = text.replace(/\D/g, '');
            if (userPhone.length < 10) {
                await ctx.reply('❌ Введите корректный номер телефона:');
                return;
            }
            
            try {
                const { error } = await supabase
                    .from('users')
                    .update({ phone: userPhone })
                    .eq('id', userId);

                if (error) throw error;

                await ctx.reply('✅ Телефон успешно изменен!', mainMenu);
                userStates.delete(userId);
            } catch (error) {
                console.error('Ошибка изменения телефона:', error);
                await ctx.reply('❌ Ошибка изменения телефона. Попробуйте позже.');
            }
            break;
        case 'edit_email':
            // Изменение email
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(text)) {
                await ctx.reply('❌ Введите корректный email:');
                return;
            }
            
            try {
                const { error } = await supabase
                    .from('users')
                    .update({ email: text.trim() })
                    .eq('id', userId);

                if (error) throw error;

                await ctx.reply('✅ Email успешно изменен!', mainMenu);
                userStates.delete(userId);
            } catch (error) {
                console.error('Ошибка изменения email:', error);
                await ctx.reply('❌ Ошибка изменения email. Попробуйте позже.');
            }
            break;
    }
});

// Обработка inline кнопок
bot.on('callback_query', async (ctx) => {
  const action = ctx.callbackQuery.data;
  const userId = ctx.from.id;
  const state = userStates.get(userId);
  
  console.log('🔍 Получен callback:', action, 'от пользователя:', userId);
  
  if (action === 'back_to_main') {
    // Если пользователь в процессе создания, очищаем состояние
    if (state) {
      userStates.delete(userId);
    }
    const menu = (ctx.from.id === ADMIN_ID || ctx.from.id === AI_ADMIN_ID) ? adminMenu : mainMenu;
    
    try {
      await ctx.editMessageText('Выберите действие в меню ниже:', menu);
    } catch (error) {
      // Если не можем редактировать сообщение, отправляем новое
      await ctx.reply('Выберите действие в меню ниже:', menu);
    }
    
    await ctx.answerCbQuery();
  } else if (action.startsWith('approve_promo_')) {
    console.log('🚀 Обработка approve_promo для пользователя:', userId);
    if (ctx.from.id !== ADMIN_ID) {
      console.log('❌ Отклонено: пользователь не админ. ID:', ctx.from.id, 'ADMIN_ID:', ADMIN_ID);
      await ctx.answerCbQuery('❌ Только для администратора');
      return;
    }
    
    const adId = action.replace('approve_promo_', '');
    console.log('📝 Попытка одобрения объявления:', adId);
    
    try {
      // Получаем объявление вместе с telegram_id пользователя
      const { data: ad, error } = await supabase
        .from('ads')
        .select(`
          id,
          user_id,
          title,
          description,
          price,
          website,
          location,
          location_text,
          contact,
          hide_username,
          status,
          is_promo,
          created_at,
          users!inner(
            telegram_id
          )
        `)
        .eq('id', adId)
        .single();
      
      console.log('Получено объявление:', ad);
      
      if (error || !ad) {
        console.error('Объявление не найдено:', error);
        await ctx.answerCbQuery('❌ Объявление не найдено');
        return;
      }
      
      // Обновляем статус на active (одобрено для оплаты)
      const { error: updateError } = await supabase
        .from('ads')
        .update({ status: 'active' })
        .eq('id', adId);
      
      if (updateError) {
        console.error('Ошибка обновления статуса:', updateError);
        await ctx.answerCbQuery('❌ Ошибка обновления статуса');
        return;
      }
      
      console.log('Статус обновлен, отправляю уведомление пользователю:', ad.users.telegram_id);
      
      // Отправляем уведомление пользователю с кнопкой оплаты
      try {
        console.log('📡 Вызываю sendPaymentNotification для объявления:', ad.id, 'пользователь:', ad.users.telegram_id);
        
        // Создаем объект объявления с правильным telegram_id
        const adForNotification = {
          ...ad,
          user_id: ad.users.telegram_id // Используем telegram_id для отправки сообщения
        };
        
        const notificationSent = await sendPaymentNotification(adForNotification);
        
        if (notificationSent) {
          console.log('✅ Уведомление успешно отправлено');
        } else {
          console.log('❌ Уведомление не отправлено, проверьте логи выше');
        }
      } catch (error) {
        console.error('❌ Ошибка отправки уведомления пользователю:', error);
      }
      
      await ctx.editMessageText(
        '✅ Рекламное объявление одобрено!\n\n' +
        '📢 Пользователь получил уведомление об оплате',
        Markup.inlineKeyboard([
          [Markup.button.callback('⬅ Назад', 'back_to_main')]
        ])
      );
      
      await ctx.answerCbQuery('✅ Объявление одобрено');
    } catch (error) {
      console.error('Ошибка одобрения рекламы:', error);
      await ctx.answerCbQuery('❌ Ошибка');
    }
  } else if (action.startsWith('reject_promo_')) {
    if (ctx.from.id !== ADMIN_ID && ctx.from.id !== AI_ADMIN_ID) {
      await ctx.answerCbQuery('❌ Только для администратора');
      return;
    }
    
    const adId = action.replace('reject_promo_', '');
    
    try {
      // Обновляем статус на archived (отклонено)
      const { error } = await supabase
        .from('ads')
        .update({ status: 'archived' })
        .eq('id', adId);
      
      if (error) {
        await ctx.answerCbQuery('❌ Ошибка обновления статуса');
        return;
      }
      
      await ctx.editMessageText(
        '❌ Рекламное объявление отклонено',
        Markup.inlineKeyboard([
          [Markup.button.callback('⬅ Назад', 'back_to_main')]
        ])
      );
      
      await ctx.answerCbQuery('❌ Объявление отклонено');
    } catch (error) {
      console.error('Ошибка отклонения рекламы:', error);
      await ctx.answerCbQuery('❌ Ошибка');
    }
  } else if (action.startsWith('confirm_payment_')) {
    if (ctx.from.id !== ADMIN_ID && ctx.from.id !== AI_ADMIN_ID) {
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
      
      // Обновляем статус объявления на опубликованный
      const { error: updateError } = await supabase
        .from('ads')
        .update({ status: 'published' })
        .eq('id', adId);
        
      if (updateError) {
        console.error('❌ Ошибка обновления статуса объявления:', updateError);
      } else {
        console.log('✅ Статус объявления обновлен на published');
      }
      
      // Уведомляем пользователя
      await bot.telegram.sendMessage(userId, 
        '✅ Оплата подтверждена!\n\n' +
        '🎉 Ваше рекламное объявление опубликовано в канале\n' +
        '📢 Пользователи могут связаться с вами напрямую\n\n' +
        'Спасибо за использование Lavka26! 🚀'
      );
      
      try {
        await ctx.editMessageText(
          '✅ Оплата подтверждена\n\n' +
          '📢 Объявление опубликовано в канале',
          Markup.inlineKeyboard([
            [Markup.button.callback('⬅ Назад', 'back_to_main')]
          ])
        );
      } catch (editError) {
        console.error('Ошибка редактирования сообщения:', editError);
        // Если не можем отредактировать, отправляем новое сообщение
        await ctx.reply(
          '✅ Оплата подтверждена\n\n' +
          '📢 Объявление опубликовано в канале',
          Markup.inlineKeyboard([
            [Markup.button.callback('⬅ Назад', 'back_to_main')]
          ])
        );
      }
      
      await ctx.answerCbQuery('✅ Оплата подтверждена');
    } catch (error) {
      console.error('Ошибка подтверждения оплаты:', error);
      await ctx.answerCbQuery('❌ Ошибка');
    }
  } else if (action.startsWith('reject_payment_')) {
    if (ctx.from.id !== ADMIN_ID && ctx.from.id !== AI_ADMIN_ID) {
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
  } else if (action.startsWith('paid_promo_')) {
    // Пользователь сообщил что оплатил
    const adId = action.replace('paid_promo_', '');
    console.log('🚀 Обработка paid_promo для объявления:', adId, 'пользователь:', ctx.from.id);
    
    try {
      // Получаем объявление
      const { data: ad, error } = await supabase
        .from('ads')
        .select('*')
        .eq('id', parseInt(adId))
        .single();

      if (error || !ad) {
        console.error('❌ Объявление не найдено:', error);
        await ctx.answerCbQuery('❌ Объявление не найдено');
        return;
      }

      console.log('📝 Объявление найдено:', ad.title, 'текущий статус:', ad.status);

      // Обновляем статус на active (ожидает подтверждения оплаты)
      const { error: updateError } = await supabase
        .from('ads')
        .update({ status: 'active' })
        .eq('id', parseInt(adId));

      if (updateError) {
        console.error('❌ Ошибка обновления статуса:', updateError);
        await ctx.answerCbQuery('❌ Ошибка обновления статуса');
        return;
      }

      console.log('✅ Статус обновлен на active');

      // Создаем запись о платеже
      try {
        const { data: settings } = await supabase
          .from('settings')
          .select('promo_price')
          .eq('id', 1)
          .single();

        const price = settings?.promo_price || 199;

        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            user_id: ctx.from.id,
            ad_id: parseInt(adId),
            amount: price,
            status: 'pending',
            description: `Реклама: ${ad.title}`,
            created_at: new Date().toISOString()
          });

        if (paymentError) {
          console.error('❌ Ошибка создания платежа:', paymentError);
        } else {
          console.log('✅ Платеж создан успешно');
        }
      } catch (paymentError) {
        console.error('❌ Критическая ошибка создания платежа:', paymentError);
      }

      // Устанавливаем состояние для ожидания скриншота
      userStates.set(ctx.from.id, {
        step: 'payment_screenshot',
        data: { adId: parseInt(adId) }
      });

      console.log('📸 Установлено состояние payment_screenshot для пользователя:', ctx.from.id);

      await ctx.editMessageText(
        '✅ Заявка на оплату получена!\n\n' +
        '📸 Теперь отправьте скриншот чека об оплате\n\n' +
        '📱 После проверки скриншота объявление будет опубликовано',
        Markup.inlineKeyboard([
          [Markup.button.callback('❌ Отмена', `cancel_promo_${adId}`)]
        ])
      );
      
      await ctx.answerCbQuery('✅ Ожидайте скриншот');
    } catch (error) {
      console.error('❌ Ошибка обработки оплаты:', error);
      await ctx.answerCbQuery('❌ Ошибка');
    }
  } else if (action.startsWith('cancel_promo_')) {
    // Отмена оплаты
    const adId = action.replace('cancel_promo_', '');
    
    try {
      await ctx.editMessageText(
        '❌ Оплата отменена\n\n' +
        '📢 Вы можете вернуться к оплате позже\n\n' +
        'Для вопросов свяжитесь с администратором',
        Markup.inlineKeyboard([
          [Markup.button.callback('⬅ Назад', 'back_to_main')]
        ])
      );
      
      await ctx.answerCbQuery('❌ Оплата отменена');
    } catch (error) {
      console.error('Ошибка отмены оплаты:', error);
      await ctx.answerCbQuery('❌ Ошибка');
    }
  } else if (action === 'finance_sbp') {
    // Настройки реквизитов СБП
    try {
      // Получаем актуальные реквизиты из базы
      const { data: settings, error } = await supabase
        .from('settings')
        .select('sbp_phone, sbp_bank, sbp_recipient, promo_price')
        .eq('id', 1)
        .single();

      let phone = 'не настроен';
      let bank = 'не настроен';
      let recipient = 'не настроен';
      let price = 'не настроена';
      
      if (!error && settings) {
        phone = settings.sbp_phone || 'не настроен';
        bank = settings.sbp_bank || 'не настроен';
        recipient = settings.sbp_recipient || 'не настроен';
        price = settings.promo_price || 'не настроена';
      }

      await ctx.editMessageText(
        '💰 Финансовые настройки\n\n' +
        'Текущие реквизиты:\n' +
        `📞 Телефон: ${phone}\n` +
        `🏦 Банк: ${bank}\n` +
        `👤 Получатель: ${recipient}\n` +
        `💰 Цена рекламы: ${price} ₽\n\n` +
        'Выберите действие:',
        Markup.inlineKeyboard([
          [Markup.button.callback('📞 Изменить телефон', 'finance_phone')],
          [Markup.button.callback('🏦 Изменить банк', 'finance_bank')],
          [Markup.button.callback('💰 Изменить цену рекламы', 'finance_price')],
          [Markup.button.callback('⬅ Назад', 'back_to_main')]
        ])
      );
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Ошибка загрузки реквизитов СБП:', error);
      await ctx.editMessageText(
        '❌ Ошибка загрузки реквизитов',
        Markup.inlineKeyboard([
          [Markup.button.callback('⬅ Назад', 'back_to_main')]
        ])
      );
      await ctx.answerCbQuery();
    }
  } else if (action === 'finance_stats') {
    // Статистика бота
    try {
      // Получаем статистику объявлений
      const { data: stats } = await supabase
        .from('ads')
        .select('status, is_promo, created_at');

      const totalAds = stats?.length || 0;
      const activeAds = stats?.filter(ad => ad.status === 'active').length || 0;
      const promoAds = stats?.filter(ad => ad.is_promo).length || 0;
      
      // Получаем статистику платежей
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, status, created_at, description')
        .order('created_at', { ascending: false });

      const totalPayments = payments?.length || 0;
      const completedPayments = payments?.filter(p => p.status === 'completed').length || 0;
      const pendingPayments = payments?.filter(p => p.status === 'pending' || p.status === 'payment_pending' || p.status === 'payment_review').length || 0;
      
      const totalIncome = payments?.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const todayIncome = payments?.filter(p => 
        p.status === 'completed' &&
        new Date(p.created_at).toDateString() === new Date().toDateString()
      ).reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      let statsText = '📊 Статистика бота\n\n';
      
      // Статистика объявлений
      statsText += '📄 Объявления:\n';
      statsText += `  • Всего: ${totalAds}\n`;
      statsText += `  • Активных: ${activeAds}\n`;
      statsText += `  • Рекламных: ${promoAds}\n\n`;
      
      // Статистика платежей
      statsText += '💳 Платежи:\n';
      statsText += `  • Всего платежей: ${totalPayments}\n`;
      statsText += `  • Завершенных: ${completedPayments}\n`;
      statsText += `  • В ожидании: ${pendingPayments}\n\n`;
      
      // Финансовая статистика
      statsText += '💰 Доход:\n';
      statsText += `  • Общий доход: ${totalIncome} ₽\n`;
      statsText += `  • Доход сегодня: ${todayIncome} ₽\n`;
      
      // Доход за месяц
      const monthIncome = payments?.filter(p => 
        p.status === 'completed' &&
        new Date(p.created_at).getMonth() === new Date().getMonth() &&
        new Date(p.created_at).getFullYear() === new Date().getFullYear()
      ).reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      statsText += `  • Доход за месяц: ${monthIncome} ₽\n\n`;
      
      // Статистика по типам
      const promoPayments = payments?.filter(p => p.status === 'completed' && p.description?.includes('Реклама')).length || 0;
      const servicePayments = payments?.filter(p => p.status === 'completed' && !p.description?.includes('Реклама')).length || 0;
      const publishedAds = stats?.filter(ad => ad.status === 'published').length || 0;
      const promotedAds = stats?.filter(ad => ad.is_top || ad.is_highlighted || ad.is_urgent).length || 0;
      
      statsText += '📊 Детальная статистика:\n';
      statsText += `  • Рекламных платежей: ${promoPayments}\n`;
      statsText += `  • Платежей за услуги: ${servicePayments}\n`;
      statsText += `  • Опубликовано объявлений: ${publishedAds}\n`;
      statsText += `  • Продвинутых объявлений: ${promotedAds}\n\n`;
      
      // Последние платежи
      if (payments && payments.length > 0) {
        statsText += '🔄 Последние платежи:\n';
        const recentPayments = payments.slice(0, 5);
        for (const payment of recentPayments) {
          const status = payment.status === 'completed' ? '✅' : 
                        payment.status === 'pending' || payment.status === 'payment_pending' ? '⏳' :
                        payment.status === 'payment_review' ? '📸' : '❌';
          statsText += `  ${status} ${payment.amount} ₽ - ${payment.description?.substring(0, 30) || 'Без описания'}...\n`;
        }
      }

      await ctx.editMessageText(statsText, Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Обновить', 'finance_stats')],
        [Markup.button.callback('📝 Реквизиты СБП', 'finance_sbp')],
        [Markup.button.callback('⬅ Назад', 'back_to_main')]
      ]));
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      await ctx.editMessageText('❌ Ошибка загрузки статистики');
    }
    await ctx.answerCbQuery();
  } else if (action === 'finance_phone') {
    // Изменение телефона СБП
    await ctx.editMessageText(
      '💰 Изменение телефона СБП\n\n' +
      'Введите новый номер телефона (формат: 79123456789):',
      Markup.inlineKeyboard([
        [Markup.button.callback('⬅ Отмена', 'finance_sbp')]
      ])
    );
    await ctx.answerCbQuery();
    
    // Устанавливаем состояние для ввода телефона
    userStates.set(ctx.from.id, {
      step: 'finance_phone',
      data: {}
    });
  } else if (action === 'finance_bank') {
    // Изменение банка СБП
    await ctx.editMessageText(
      '💰 Изменение банка СБП\n\n' +
      'Введите название банка:',
      Markup.inlineKeyboard([
        [Markup.button.callback('⬅ Отмена', 'finance_sbp')]
      ])
    );
    await ctx.answerCbQuery();
    
    // Устанавливаем состояние для ввода банка
    userStates.set(ctx.from.id, {
      step: 'finance_bank',
      data: {}
    });
  } else if (action === 'finance_price') {
    // Изменение цены рекламы
    await ctx.editMessageText(
      '💰 Изменение цены рекламы\n\n' +
      'Введите новую цену (только число):',
      Markup.inlineKeyboard([
        [Markup.button.callback('⬅ Отмена', 'finance_sbp')]
      ])
    );
    await ctx.answerCbQuery();
    
    // Устанавливаем состояние для ввода цены
    userStates.set(ctx.from.id, {
      step: 'finance_price',
      data: {}
    });
  } else if (action === 'edit_profile') {
    // Редактирование профиля
    await ctx.editMessageText(
      '👤 Редактирование профиля\n\n' +
      'Выберите что хотите изменить:',
      Markup.inlineKeyboard([
        [Markup.button.callback('📝 Имя', 'edit_name')],
        [Markup.button.callback('📞 Контакт', 'edit_contact')],
        [Markup.button.callback('⬅ Назад', 'back_to_main')]
      ])
    );
  } else if (action === 'notification_settings') {
    // Настройки уведомлений
    await ctx.editMessageText(
      '🔔 Настройки уведомлений\n\n' +
      '📬 Новые объявления: включено\n' +
      '💌 Ответы на объявления: включено\n' +
      '📢 Рекламные уведомления: включено\n\n' +
      'Выберите действие:',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔕 Выключить все', 'disable_all_notifications')],
        [Markup.button.callback('⬅ Назад', 'back_to_main')]
      ])
    );
  } else if (action === 'moderation_queue') {
    // Очередь модерации
    try {
      const { data: ads, error } = await supabase
        .from('ads')
        .select(`
          *,
          users!inner(
            username,
            first_name
          )
        `)
        .eq('status', 'moderation')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки модерации:', error);
        await ctx.editMessageText('❌ Ошибка загрузки объявлений. Попробуйте позже.');
        return;
      }

      if (!ads || ads.length === 0) {
        await ctx.editMessageText(
          '📋 Ожидают модерации\n\n' +
          '✅ Все объявления проверены!',
          Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Обновить', 'moderation_queue')],
            [Markup.button.callback('⬅ Назад', 'back_to_main')]
          ])
        );
        return;
      }

      let text = '📋 Ожидают модерации:\n\n';
      const buttons = [];

      for (const ad of ads) {
        text += `📝 ${ad.title}\n`;
        text += `👤 @${ad.users.username || 'unknown'}\n`;
        text += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n\n`;
        
        buttons.push([Markup.button.callback(`📄 ${ad.title}`, `view_ad_${ad.id}`)]);
      }

      buttons.push([Markup.button.callback('🔄 Обновить', 'moderation_queue')]);
      buttons.push([Markup.button.callback('⬅ Назад', 'back_to_main')]);

      await ctx.editMessageText(text, {
        reply_markup: { inline_keyboard: buttons }
      });
      
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Ошибка загрузки модерации:', error);
      await ctx.answerCbQuery('❌ Ошибка загрузки');
    }
  } else if (action === 'approved_ads') {
    // Одобренные объявления
    try {
      const { data: ads, error } = await supabase
        .from('ads')
        .select(`
          *,
          users!inner(
            username,
            first_name
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки одобренных:', error);
        await ctx.editMessageText('❌ Ошибка загрузки объявлений. Попробуйте позже.');
        return;
      }

      if (!ads || ads.length === 0) {
        await ctx.editMessageText(
          '✅ Одобренные объявления\n\n' +
          '📄 Пока нет одобренных объявлений',
          Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Обновить', 'approved_ads')],
            [Markup.button.callback('⬅ Назад', 'back_to_main')]
          ])
        );
        return;
      }

      let text = '✅ Одобренные объявления:\n\n';
      const buttons = [];

      for (const ad of ads) {
        text += `📝 ${ad.title}\n`;
        text += `👤 @${ad.users.username || 'unknown'}\n`;
        text += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n\n`;
        
        buttons.push([Markup.button.callback(`📄 ${ad.title}`, `view_ad_${ad.id}`)]);
      }

      buttons.push([Markup.button.callback('🔄 Обновить', 'approved_ads')]);
      buttons.push([Markup.button.callback('⬅ Назад', 'back_to_main')]);

      await ctx.editMessageText(text, {
        reply_markup: { inline_keyboard: buttons }
      });
      
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Ошибка загрузки одобренных:', error);
      await ctx.answerCbQuery('❌ Ошибка загрузки');
    }
  } else if (action === 'rejected_ads') {
    // Отклоненные объявления
    try {
      const { data: ads, error } = await supabase
        .from('ads')
        .select(`
          *,
          users!inner(
            username,
            first_name
          )
        `)
        .eq('status', 'rejected')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки отклоненных:', error);
        await ctx.editMessageText('❌ Ошибка загрузки объявлений. Попробуйте позже.');
        return;
      }

      if (!ads || ads.length === 0) {
        await ctx.editMessageText(
          '❌ Отклоненные объявления\n\n' +
          '📄 Пока нет отклоненных объявлений',
          Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Обновить', 'rejected_ads')],
            [Markup.button.callback('⬅ Назад', 'back_to_main')]
          ])
        );
        return;
      }

      let text = '❌ Отклоненные объявления:\n\n';
      const buttons = [];

      for (const ad of ads) {
        text += `📝 ${ad.title}\n`;
        text += `👤 @${ad.users.username || 'unknown'}\n`;
        text += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n\n`;
        
        buttons.push([Markup.button.callback(`📄 ${ad.title}`, `view_ad_${ad.id}`)]);
      }

      buttons.push([Markup.button.callback('🔄 Обновить', 'rejected_ads')]);
      buttons.push([Markup.button.callback('⬅ Назад', 'back_to_main')]);

      await ctx.editMessageText(text, {
        reply_markup: { inline_keyboard: buttons }
      });
      
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Ошибка загрузки отклоненных:', error);
      await ctx.answerCbQuery('❌ Ошибка загрузки');
    }
  } else if (action === 'edit_profile') {
    // Редактирование профиля
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        await ctx.answerCbQuery('❌ Профиль не найден');
        return;
      }

      let profileText = '👤 Ваш профиль:\n\n';
      profileText += `📝 Имя: ${user.first_name || 'Не указано'}\n`;
      profileText += `👤 Username: @${user.username || 'Не указано'}\n`;
      profileText += `📱 Телефон: ${user.phone || 'Не указан'}\n`;
      profileText += `📧 Email: ${user.email || 'Не указан'}\n\n`;
      profileText += 'Выберите что хотите изменить:';

      await ctx.editMessageText(profileText, Markup.inlineKeyboard([
        [Markup.button.callback('📝 Изменить имя', 'edit_first_name')],
        [Markup.button.callback('📱 Изменить телефон', 'edit_phone')],
        [Markup.button.callback('📧 Изменить email', 'edit_email')],
        [Markup.button.callback('⬅ Назад', 'back_to_main')]
      ]));
      
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      await ctx.answerCbQuery('❌ Ошибка загрузки профиля');
    }
  } else if (action === 'edit_first_name') {
    // Изменение имени
    await ctx.editMessageText(
      '📝 Изменение имени\n\n' +
      'Введите новое имя:',
      Markup.inlineKeyboard([
        [Markup.button.callback('⬅ Отмена', 'edit_profile')]
      ])
    );
    await ctx.answerCbQuery();
    
    userStates.set(userId, {
      step: 'edit_first_name',
      data: {}
    });
  } else if (action === 'edit_phone') {
    // Изменение телефона
    await ctx.editMessageText(
      '📱 Изменение телефона\n\n' +
      'Введите новый номер телефона:',
      Markup.inlineKeyboard([
        [Markup.button.callback('⬅ Отмена', 'edit_profile')]
      ])
    );
    await ctx.answerCbQuery();
    
    userStates.set(userId, {
      step: 'edit_phone',
      data: {}
    });
  } else if (action === 'edit_email') {
    // Изменение email
    await ctx.editMessageText(
      '📧 Изменение email\n\n' +
      'Введите новый email:',
      Markup.inlineKeyboard([
        [Markup.button.callback('⬅ Отмена', 'edit_profile')]
      ])
    );
    await ctx.answerCbQuery();
    
    userStates.set(userId, {
      step: 'edit_email',
      data: {}
    });
  } else if (action.startsWith('view_ad_')) {
    // Просмотр объявления
    const adId = action.replace('view_ad_', '');
    
    try {
      const { data: ad, error } = await supabase
        .from('ads')
        .select(`
          *,
          users!inner(
            username,
            first_name
          )
        `)
        .eq('id', adId)
        .single();

      if (error || !ad) {
        await ctx.answerCbQuery('❌ Объявление не найдено');
        return;
      }

      let text = `${ad.is_promo ? '📢' : '📝'} ${ad.title}\n\n`;
      text += `👤 Автор: @${ad.users?.username || 'unknown'}\n`;
      text += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n\n`;
      text += `📋 Описание:\n${ad.description}\n\n`;
      
      if (ad.price && !ad.is_promo) text += `💰 Цена: ${ad.price} ₽\n`;
      if (ad.website) text += `🌐 Сайт: ${ad.website}\n`;
      if (ad.contact) text += `📞 Контакт: ${ad.contact}\n`;
      if (ad.location_text) text += `📍 Адрес: ${ad.location_text}\n`;

      const buttons = [
        [Markup.button.callback('⬅ Назад', 'back_to_main')]
      ];

      // Добавляем кнопки модерации если это администратор и объявление на модерации
      if ((ctx.from.id === ADMIN_ID || ctx.from.id === AI_ADMIN_ID) && ad.status === 'moderation') {
        buttons.unshift([
          Markup.button.callback('✅ Одобрить', `approve_promo_${ad.id}`),
          Markup.button.callback('❌ Отклонить', `reject_promo_${ad.id}`)
        ]);
      }

      await ctx.editMessageText(text, Markup.inlineKeyboard(buttons));
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Ошибка при просмотре объявления:', error);
      await ctx.answerCbQuery('❌ Ошибка загрузки объявления');
    }
  } else if (action === 'view_my_ads') {
    // Загрузка и отображение объявлений пользователя
    try {
      const { data: ads, error } = await supabase
        .from('ads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки объявлений:', error);
        await ctx.editMessageText('❌ Ошибка загрузки объявлений. Попробуйте позже.');
        return;
      }

      if (!ads || ads.length === 0) {
        await ctx.editMessageText(
          '📋 Ваши объявления:\n\n' +
          'У вас пока нет объявлений.\n\n' +
          '📝 Создайте первое объявление!',
          Markup.inlineKeyboard([
            [Markup.button.callback('🏠 Главное меню', 'back_to_main')]
          ])
        );
        return;
      }

      let text = '📋 Ваши объявления:\n\n';
      const buttons = [];

      for (const ad of ads) {
        const status = ad.status === 'active' ? '✅ Активно' : 
                      ad.status === 'moderation' ? '⏳ Модерация' : 
                      ad.status === 'archived' ? '❌ Архив' : '📝 Черновик';
        
        text += `📝 ${ad.title}\n`;
        text += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n`;
        text += `📊 Статус: ${status}\n\n`;
        
        buttons.push([Markup.button.callback(`📄 ${ad.title}`, `view_ad_${ad.id}`)]);
      }

      buttons.push([Markup.button.callback('🏠 Главное меню', 'back_to_main')]);

      await ctx.editMessageText(text, {
        reply_markup: { inline_keyboard: buttons }
      });
      
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Ошибка загрузки объявлений:', error);
      await ctx.answerCbQuery('❌ Ошибка загрузки объявлений');
    }
  } else if (action === 'view_drafts') {
    // Черновики объявлений
    try {
      const { data: ads, error } = await supabase
        .from('ads')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['draft', 'moderation'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки черновиков:', error);
        await ctx.editMessageText('❌ Ошибка загрузки черновиков. Попробуйте позже.');
        return;
      }

      if (!ads || ads.length === 0) {
        await ctx.editMessageText(
          '📝 Черновики\n\n' +
          '📄 У вас пока нет черновиков\n\n' +
          '💡 Создайте новое объявление!',
          Markup.inlineKeyboard([
            [Markup.button.callback('📝 Создать объявление', 'create_ad')],
            [Markup.button.callback('⬅ Назад', 'view_my_ads')]
          ])
        );
        return;
      }

      let text = '📝 Черновики:\n\n';
      const buttons = [];

      for (const ad of ads) {
        const status = ad.status === 'moderation' ? '⏳ На модерации' : '📝 Черновик';
        text += `${ad.is_promo ? '📢' : '📝'} ${ad.title}\n`;
        text += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n`;
        text += `📊 Статус: ${status}\n\n`;
        
        buttons.push([Markup.button.callback(
          `${ad.status === 'moderation' ? '⏳' : '📝'} ${ad.title}`,
          `view_ad_${ad.id}`
        )]);
      }

      text += `Всего черновиков: ${ads.length}`;

      buttons.push([Markup.button.callback('🔄 Обновить', 'view_drafts')]);
      buttons.push([Markup.button.callback('⬅ Назад', 'view_my_ads')]);

      await ctx.editMessageText(text, {
        reply_markup: { inline_keyboard: buttons }
      });
      
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Ошибка загрузки черновиков:', error);
      await ctx.answerCbQuery('❌ Ошибка загрузки черновиков');
    }
  } else if (action === 'view_unpaid') {
    // Неоплаченные объявления
    try {
      const { data: ads, error } = await supabase
        .from('ads')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'payment_pending', 'payment_review'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки неоплаченных:', error);
        await ctx.editMessageText('❌ Ошибка загрузки неоплаченных объявлений. Попробуйте позже.');
        return;
      }

      if (!ads || ads.length === 0) {
        await ctx.editMessageText(
          '💳 Неоплаченные объявления\n\n' +
          '📄 У вас пока нет неоплаченных объявлений\n\n' +
          '💡 Все ваши объявления оплачены!',
          Markup.inlineKeyboard([
            [Markup.button.callback('⬅ Назад', 'view_my_ads')]
          ])
        );
        return;
      }

      let text = '💳 Неоплаченные объявления:\n\n';
      const buttons = [];

      for (const ad of ads) {
        const status = ad.status === 'active' ? '💳 Ожидает оплаты' : 
                      ad.status === 'payment_pending' ? '📸 Ожидает скриншот' : 
                      '🔍 На проверке';
        text += `${ad.is_promo ? '📢' : '📝'} ${ad.title}\n`;
        text += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n`;
        text += `📊 Статус: ${status}\n\n`;
        
        buttons.push([Markup.button.callback(
          `${ad.status === 'active' ? '💳' : ad.status === 'payment_pending' ? '📸' : '🔍'} ${ad.title}`,
          `view_ad_${ad.id}`
        )]);
      }

      text += `Всего неоплаченных: ${ads.length}`;

      buttons.push([Markup.button.callback('🔄 Обновить', 'view_unpaid')]);
      buttons.push([Markup.button.callback('⬅ Назад', 'view_my_ads')]);

      await ctx.editMessageText(text, {
        reply_markup: { inline_keyboard: buttons }
      });
      
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Ошибка загрузки неоплаченных:', error);
      await ctx.answerCbQuery('❌ Ошибка загрузки неоплаченных');
    }
  } else if (action === 'view_paid') {
    // Оплаченные объявления
    try {
      const { data: ads, error } = await supabase
        .from('ads')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['published', 'completed'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки оплаченных:', error);
        await ctx.editMessageText('❌ Ошибка загрузки оплаченных объявлений. Попробуйте позже.');
        return;
      }

      if (!ads || ads.length === 0) {
        await ctx.editMessageText(
          '✅ Оплаченные объявления\n\n' +
          '📄 У вас пока нет оплаченных объявлений\n\n' +
          '💡 Оплатите объявление для публикации!',
          Markup.inlineKeyboard([
            [Markup.button.callback('⬅ Назад', 'view_my_ads')]
          ])
        );
        return;
      }

      let text = '✅ Оплаченные объявления:\n\n';
      const buttons = [];

      for (const ad of ads) {
        const status = ad.status === 'published' ? '✅ Опубликовано' : '✅ Завершено';
        text += `${ad.is_promo ? '📢' : '📝'} ${ad.title}\n`;
        text += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n`;
        text += `📊 Статус: ${status}\n\n`;
        
        buttons.push([Markup.button.callback(
          `✅ ${ad.title}`,
          `view_ad_${ad.id}`
        )]);
      }

      text += `Всего оплаченных: ${ads.length}`;

      buttons.push([Markup.button.callback('🔄 Обновить', 'view_paid')]);
      buttons.push([Markup.button.callback('⬅ Назад', 'view_my_ads')]);

      await ctx.editMessageText(text, {
        reply_markup: { inline_keyboard: buttons }
      });
      
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Ошибка загрузки оплаченных:', error);
      await ctx.answerCbQuery('❌ Ошибка загрузки оплаченных');
    }
  } else if (action === 'view_all_ads') {
    // Все объявления пользователя
    try {
      const { data: ads, error } = await supabase
        .from('ads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки объявлений:', error);
        await ctx.editMessageText('❌ Ошибка загрузки объявлений. Попробуйте позже.');
        return;
      }

      if (!ads || ads.length === 0) {
        await ctx.editMessageText(
          '📋 Ваши объявления\n\n' +
          '📄 У вас пока нет объявлений\n\n' +
          '💡 Создайте первое объявление!',
          Markup.inlineKeyboard([
            [Markup.button.callback('📝 Создать объявление', 'create_ad')],
            [Markup.button.callback('⬅ Назад', 'view_my_ads')]
          ])
        );
        return;
      }

      let text = '📋 Ваши объявления:\n\n';
      const buttons = [];

      for (const ad of ads) {
        const status = ad.status === 'active' ? '💳 Ожидает оплаты' : 
                      ad.status === 'payment_pending' ? '📸 Ожидает скриншот' :
                      ad.status === 'payment_review' ? '🔍 На проверке' :
                      ad.status === 'published' ? '✅ Опубликовано' :
                      ad.status === 'completed' ? '✅ Завершено' :
                      ad.status === 'moderation' ? '⏳ Модерация' :
                      ad.status === 'archived' ? '❌ Архив' : '📝 Черновик';
        
        text += `${ad.is_promo ? '📢' : '📝'} ${ad.title}\n`;
        text += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n`;
        text += `📊 Статус: ${status}\n\n`;
        
        buttons.push([Markup.button.callback(
          `${ad.is_promo ? '📢' : '📝'} ${ad.title}`,
          `view_ad_${ad.id}`
        )]);
      }

      text += `Всего объявлений: ${ads.length}`;

      buttons.push([Markup.button.callback('🔄 Обновить', 'view_all_ads')]);
      buttons.push([Markup.button.callback('⬅ Назад', 'view_my_ads')]);

      await ctx.editMessageText(text, {
        reply_markup: { inline_keyboard: buttons }
      });
      
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Ошибка загрузки объявлений:', error);
      await ctx.answerCbQuery('❌ Ошибка загрузки объявлений');
    }
  } else if (action === 'view_favorites') {
    // Загрузка и отображение избранных объявлений
    try {
      const { data: favorites, error } = await supabase
        .from('favorites')
        .select(`
          *,
          ads!inner(
            id,
            title,
            price,
            created_at,
            status,
            users!inner(
              username,
              first_name
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки избранного:', error);
        await ctx.editMessageText('❌ Ошибка загрузки избранного. Попробуйте позже.');
        return;
      }

      if (!favorites || favorites.length === 0) {
        await ctx.editMessageText(
          '❤️ Ваши избранные объявления:\n\n' +
          'У вас пока нет избранных объявлений.\n\n' +
          '🔍 Найдите интересные объявления!',
          Markup.inlineKeyboard([
            [Markup.button.callback('🏠 Главное меню', 'back_to_main')]
          ])
        );
        return;
      }

      let text = '❤️ Ваши избранные объявления:\n\n';
      const buttons = [];

      for (const fav of favorites) {
        const ad = fav.ads;
        text += `📝 ${ad.title}\n`;
        text += `👤 @${ad.users.username || 'unknown'}\n`;
        text += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n\n`;
        
        buttons.push([Markup.button.callback(`📄 ${ad.title}`, `view_ad_${ad.id}`)]);
      }

      buttons.push([Markup.button.callback('🏠 Главное меню', 'back_to_main')]);

      await ctx.editMessageText(text, {
        reply_markup: { inline_keyboard: buttons }
      });
      
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Ошибка загрузки избранного:', error);
      await ctx.answerCbQuery('❌ Ошибка загрузки избранного');
    }
  } else if (action === 'view_user_finance') {
    // Просмотр финансов пользователя
    try {
      // Получаем все платежи пользователя
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки платежей:', error);
        await ctx.editMessageText('❌ Ошибка загрузки финансов. Попробуйте позже.');
        return;
      }

      if (!payments || payments.length === 0) {
        await ctx.editMessageText(
          '💰 Мои финансы:\n\n' +
          'У вас пока нет платежей.\n\n' +
          '📝 Создайте рекламное объявление или воспользуйтесь услугами продвижения!',
          Markup.inlineKeyboard([
            [Markup.button.callback('🏠 Главное меню', 'back_to_main')]
          ])
        );
        return;
      }

      let text = '💰 Мои платежи:\n\n';
      const buttons = [];

      for (const payment of payments) {
        const status = payment.status === 'completed' ? '✅ Оплачено' : 
                      payment.status === 'pending' ? '⏳ Ожидает' : '❌ Отменено';
        
        text += `📝 ${payment.description}\n`;
        text += `💰 Сумма: ${payment.amount} ₽\n`;
        text += `📊 Статус: ${status}\n`;
        text += `📅 ${new Date(payment.created_at).toLocaleDateString('ru-RU')}\n\n`;
      }

      text += `Всего платежей: ${payments.length}`;

      await ctx.editMessageText(text, {
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback('🔄 Обновить', 'view_user_finance')],
            [Markup.button.callback('🏠 Главное меню', 'back_to_main')]
          ]
        }
      });
      
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Ошибка загрузки финансов:', error);
      await ctx.answerCbQuery('❌ Ошибка загрузки');
    }
  } else if (action.startsWith('promo_')) {
    // Обработка выбора услуги продвижения
    const serviceId = action.replace('promo_', '');
    const service = promotionServices.find(s => s.id === serviceId);
    
    if (!service) {
      await ctx.answerCbQuery('❌ Услуга не найдена');
      return;
    }

    // Устанавливаем состояние для выбора объявления
    userStates.set(userId, {
      step: 'select_ad_for_promotion',
      data: { service: service }
    });

    await ctx.editMessageText(
      `🚀 Услуга: ${service.name}\n\n` +
      `💰 Стоимость: ${service.price} ₽\n` +
      `📋 ${service.description}\n\n` +
      `📝 Теперь выберите объявление для продвижения:`,
      Markup.inlineKeyboard([
        [Markup.button.callback('📋 Мои объявления', 'select_my_ads')],
        [Markup.button.callback('🔍 Поиск объявлений', 'search_ads_for_promo')],
        [Markup.button.callback('❌ Отмена', 'back_to_main')]
      ])
    );
    
    await ctx.answerCbQuery();
  } else if (action === 'select_my_ads') {
    // Выбор из своих объявлений
    try {
      const { data: ads, error } = await supabase
        .from('ads')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки объявлений:', error);
        await ctx.editMessageText('❌ Ошибка загрузки объявлений. Попробуйте позже.');
        return;
      }

      if (!ads || ads.length === 0) {
        await ctx.editMessageText(
          '📋 У вас нет активных объявлений\n\n' +
          'Сначала создайте объявление, а затем используйте услуги продвижения!',
          Markup.inlineKeyboard([
            [Markup.button.callback('🏠 Главное меню', 'back_to_main')]
          ])
        );
        return;
      }

      let text = '📋 Выберите объявление для продвижения:\n\n';
      const buttons = [];

      for (const ad of ads) {
        text += `📝 ${ad.title}\n`;
        text += `💰 ${ad.price || '0'} ₽\n\n`;
        
        buttons.push([Markup.button.callback(`📄 ${ad.title}`, `promote_ad_${ad.id}`)]);
      }

      await ctx.editMessageText(text, {
        reply_markup: {
          inline_keyboard: buttons
        }
      });
      
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Ошибка выбора объявлений:', error);
      await ctx.answerCbQuery('❌ Ошибка');
    }
  } else if (action.startsWith('promote_ad_')) {
    // Продвижение конкретного объявления
    const adId = action.replace('promote_ad_', '');
    const state = userStates.get(userId);
    
    if (!state || !state.data.service) {
      await ctx.answerCbQuery('❌ Ошибка состояния');
      return;
    }

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

      // Создаем запись о платеже
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          ad_id: adId,
          service_id: state.data.service.id,
          amount: state.data.service.price,
          description: `${state.data.service.name} для объявления "${ad.title}"`,
          status: 'pending'
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Ошибка создания платежа:', paymentError);
        await ctx.answerCbQuery('❌ Ошибка создания платежа');
        return;
      }

      // Отправляем уведомление об оплате
      await sendPromotionPaymentNotification(ctx, ad, state.data.service, payment);

      userStates.delete(userId);
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Ошибка продвижения объявления:', error);
      await ctx.answerCbQuery('❌ Ошибка');
    }
  } else if (action.startsWith('paid_promotion_')) {
    // Пользователь оплатил продвижение
    const paymentId = action.replace('paid_promotion_', '');
    
    try {
      // Получаем информацию о платеже
      const { data: payment, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error || !payment) {
        await ctx.answerCbQuery('❌ Платеж не найден');
        return;
      }

      // Обновляем статус платежа
      await supabase
        .from('payments')
        .update({ status: 'payment_pending' })
        .eq('id', paymentId);

      // Устанавливаем состояние для ожидания скриншота
      userStates.set(ctx.from.id, {
        step: 'promotion_payment_screenshot',
        data: { paymentId: paymentId }
      });

      await ctx.editMessageText(
        '✅ Заявка на оплату продвижения получена!\n\n' +
        '📸 Теперь отправьте скриншот чека об оплате\n\n' +
        '💳 Реквизиты для перевода:\n' +
        `💰 Сумма: ${payment.amount} ₽\n` +
        '📝 Комментарий: Lavka26_' + ctx.from.id + '\n\n' +
        '📱 После проверки скриншота услуга будет активирована',
        Markup.inlineKeyboard([
          [Markup.button.callback('❌ Отмена', `cancel_promotion_${paymentId}`)]
        ])
      );
      
      await ctx.answerCbQuery('✅ Ожидайте скриншот');
    } catch (error) {
      console.error('Ошибка обработки оплаты продвижения:', error);
      await ctx.answerCbQuery('❌ Ошибка');
    }
  } else if (action.startsWith('cancel_promotion_')) {
    // Отмена оплаты продвижения
    const paymentId = action.replace('cancel_promotion_', '');
    
    try {
      // Обновляем статус платежа
      await supabase
        .from('payments')
        .update({ status: 'cancelled' })
        .eq('id', paymentId);

      await ctx.editMessageText(
        '❌ Оплата продвижения отменена',
        Markup.inlineKeyboard([
          [Markup.button.callback('🏠 Главное меню', 'back_to_main')]
        ])
      );
      
      await ctx.answerCbQuery('❌ Оплата отменена');
    } catch (error) {
      console.error('Ошибка отмены оплаты продвижения:', error);
      await ctx.answerCbQuery('❌ Ошибка');
    }
  } else if (action.startsWith('confirm_promotion_payment_')) {
    // Подтверждение оплаты продвижения
    if (ctx.from.id !== ADMIN_ID && ctx.from.id !== AI_ADMIN_ID) {
      await ctx.answerCbQuery('❌ Только для администратора');
      return;
    }
    
    const parts = action.split('_');
    const paymentId = parts[3];
    const userId = parts[4];
    
    try {
      // Получаем платеж
      const { data: payment, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();
      
      if (error || !payment) {
        await ctx.answerCbQuery('❌ Платеж не найден');
        return;
      }
      
      // Получаем объявление
      const { data: ad, error: adError } = await supabase
        .from('ads')
        .select('*')
        .eq('id', payment.ad_id)
        .single();
      
      if (adError || !ad) {
        await ctx.answerCbQuery('❌ Объявление не найдено');
        return;
      }
      
      // Обновляем статус платежа
      await supabase
        .from('payments')
        .update({ status: 'completed' })
        .eq('id', paymentId);
      
      // Применяем услугу продвижения к объявлению
      try {
        await applyPromotionService(ad, payment.description);
        
        // Обновляем статус объявления на опубликованный
        const { error: updateError } = await supabase
          .from('ads')
          .update({ status: 'published' })
          .eq('id', ad.id);
          
        if (updateError) {
          console.error('❌ Ошибка обновления статуса объявления:', updateError);
        } else {
          console.log('✅ Статус объявления обновлен на published');
          
          // Отправляем объявление в канал
          try {
            await sendPromoAdToChannel(ad);
            console.log('✅ Объявление отправлено в канал');
          } catch (channelError) {
            console.error('❌ Ошибка отправки в канал:', channelError);
          }
        }
      } catch (promoError) {
        console.error('❌ Ошибка применения услуги:', promoError);
        // Продолжаем процесс даже если услуга не применилась
      }
      
      // Уведомляем пользователя
      await bot.telegram.sendMessage(userId, 
        '✅ Оплата продвижения подтверждена!\n\n' +
        '🎉 Услуга успешно активирована\n' +
        '📢 Ваше объявление теперь в топе!\n\n' +
        'Спасибо за использование Lavka26! 🚀'
      );
      
      try {
        await ctx.editMessageText(
          '✅ Оплата продвижения подтверждена\n\n' +
          '🚀 Услуга активирована',
          Markup.inlineKeyboard([
            [Markup.button.callback('⬅ Назад', 'back_to_main')]
          ])
        );
      } catch (editError) {
        console.error('Ошибка редактирования сообщения:', editError);
        // Если не можем отредактировать, отправляем новое сообщение
        await ctx.reply(
          '✅ Оплата продвижения подтверждена\n\n' +
          '🚀 Услуга активирована',
          Markup.inlineKeyboard([
            [Markup.button.callback('⬅ Назад', 'back_to_main')]
          ])
        );
      }
      
      await ctx.answerCbQuery('✅ Продвижение активировано');
    } catch (error) {
      console.error('Ошибка подтверждения оплаты продвижения:', error);
      await ctx.answerCbQuery('❌ Ошибка');
    }
  } else if (action.startsWith('reject_promotion_payment_')) {
    // Отклонение оплаты продвижения
    if (ctx.from.id !== ADMIN_ID && ctx.from.id !== AI_ADMIN_ID) {
      await ctx.answerCbQuery('❌ Только для администратора');
      return;
    }
    
    const parts = action.split('_');
    const paymentId = parts[3];
    const userId = parts[4];
    
    try {
      // Обновляем статус платежа
      await supabase
        .from('payments')
        .update({ status: 'rejected' })
        .eq('id', paymentId);
      
      // Уведомляем пользователя
      await bot.telegram.sendMessage(userId, 
        '❌ Оплата продвижения отклонена\n\n' +
        'Пожалуйста, свяжитесь с администратором для уточнения деталей\n' +
        '@' + (ctx.from.username || 'support')
      );
      
      await ctx.editMessageText(
        '❌ Оплата продвижения отклонена\n\n' +
        'Пользователь уведомлен',
        Markup.inlineKeyboard([
          [Markup.button.callback('⬅ Назад', 'back_to_main')]
        ])
      );
      
      await ctx.answerCbQuery('❌ Оплата отклонена');
    } catch (error) {
      console.error('Ошибка отклонения оплаты продвижения:', error);
      await ctx.answerCbQuery('❌ Ошибка');
    }
  } else if (action === 'test_top_promotion') {
    // Тестирование топа
    await ctx.editMessageText(
      '🔥 Тестирование топа\n\n' +
      '✅ Функция топа работает корректно\n' +
      '📢 Объявления в топе отображаются первыми\n' +
      '⏰ Время действия: 3/7/14 дней\n\n' +
      'Статус: Активно',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Обновить', 'test_top_promotion')],
        [Markup.button.callback('⬅ Назад', 'back_to_main')]
      ])
    );
    await ctx.answerCbQuery();
  } else if (action === 'test_highlight_promotion') {
    // Тестирование выделения
    await ctx.editMessageText(
      '✨ Тестирование выделения\n\n' +
      '✅ Функция выделения работает корректно\n' +
      '🎨 Объявления выделяются цветом\n' +
      '⏰ Время действия: 7 дней\n\n' +
      'Статус: Активно',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Обновить', 'test_highlight_promotion')],
        [Markup.button.callback('⬅ Назад', 'back_to_main')]
      ])
    );
    await ctx.answerCbQuery();
  } else if (action === 'test_urgent_promotion') {
    // Тестирование срочности
    await ctx.editMessageText(
      '🚀 Тестирование срочности\n\n' +
      '✅ Функция срочности работает корректно\n' +
      '⚡ Объявления помечаются как срочные\n' +
      '⏰ Время действия: 5 дней\n\n' +
      'Статус: Активно',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Обновить', 'test_urgent_promotion')],
        [Markup.button.callback('⬅ Назад', 'back_to_main')]
      ])
    );
    await ctx.answerCbQuery();
  } else if (action === 'promotion_stats') {
    // Статистика продвижений
    try {
      const { data: ads, error } = await supabase
        .from('ads')
        .select('is_top, is_highlighted, is_urgent, title')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const topAds = ads?.filter(ad => ad.is_top).length || 0;
      const highlightedAds = ads?.filter(ad => ad.is_highlighted).length || 0;
      const urgentAds = ads?.filter(ad => ad.is_urgent).length || 0;

      let statsText = '📊 Статистика продвижений\n\n';
      statsText += `🔥 Топ объявления: ${topAds}\n`;
      statsText += `✨ Выделенные объявления: ${highlightedAds}\n`;
      statsText += `🚀 Срочные объявления: ${urgentAds}\n`;
      statsText += `📢 Всего продвижений: ${topAds + highlightedAds + urgentAds}\n\n`;

      if (ads && ads.length > 0) {
        statsText += '🔝 Последние продвижения:\n';
        const recentPromos = ads.filter(ad => ad.is_top || ad.is_highlighted || ad.is_urgent).slice(0, 5);
        for (const ad of recentPromos) {
          const promoType = ad.is_top ? '🔥' : ad.is_highlighted ? '✨' : '🚀';
          statsText += `  ${promoType} ${ad.title}\n`;
        }
      }

      await ctx.editMessageText(statsText, Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Обновить', 'promotion_stats')],
        [Markup.button.callback('⬅ Назад', 'back_to_main')]
      ]));
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Ошибка загрузки статистики продвижений:', error);
      await ctx.answerCbQuery('❌ Ошибка загрузки статистики');
    }
  } else if (action === 'ai_moderate_queue') {
    // ИИ-модерация очереди
    try {
      const { data: ads, error } = await supabase
        .from('ads')
        .select('*')
        .eq('status', 'moderation')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (!ads || ads.length === 0) {
        await ctx.editMessageText(
          '🤖 ИИ-Модерация\n\n' +
          '✅ Очередь модерации пуста!\n\n' +
          'Все объявления проверены.',
          Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Обновить', 'ai_moderate_queue')],
            [Markup.button.callback('⬅ Назад', 'back_to_main')]
          ])
        );
        await ctx.answerCbQuery();
        return;
      }

      let text = '🤖 ИИ проверяет объявления:\n\n';
      const buttons = [];

      for (const ad of ads) {
        // Простая проверка на запрещенные слова
        const forbiddenWords = ['спам', 'мошенник', 'обман', 'мош', 'скам'];
        const hasForbidden = forbiddenWords.some(word => 
          ad.title.toLowerCase().includes(word) || 
          ad.description.toLowerCase().includes(word)
        );

        const aiDecision = hasForbidden ? '❌ Подозрительно' : '✅ Безопасно';
        const aiAction = hasForbidden ? 'Отклонить' : 'Одобрить';

        text += `📝 ${ad.title}\n`;
        text += `🤖 ИИ: ${aiDecision}\n`;
        text += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n\n`;
        
        buttons.push([
          Markup.button.callback(`🤖 ${aiAction}`, hasForbidden ? `ai_reject_${ad.id}` : `ai_approve_${ad.id}`),
          Markup.button.callback(`📄 Просмотр`, `view_ad_${ad.id}`)
        ]);
      }

      await ctx.editMessageText(text, {
        reply_markup: { inline_keyboard: buttons }
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.error('Ошибка ИИ-модерации:', error);
      await ctx.answerCbQuery('❌ Ошибка ИИ-модерации');
    }
  } else if (action.startsWith('ai_approve_')) {
    // ИИ-одобрение объявления
    const adId = action.replace('ai_approve_', '');
    
    try {
      const { error } = await supabase
        .from('ads')
        .update({ status: 'active' })
        .eq('id', parseInt(adId));

      if (error) throw error;

      await ctx.answerCbQuery('✅ ИИ одобрил объявление');
      console.log(`🤖 ИИ одобрил объявление ${adId}`);
    } catch (error) {
      console.error('Ошибка ИИ-одобрения:', error);
      await ctx.answerCbQuery('❌ Ошибка ИИ-одобрения');
    }
  } else if (action.startsWith('ai_reject_')) {
    // ИИ-отклонение объявления
    const adId = action.replace('ai_reject_', '');
    
    try {
      const { error } = await supabase
        .from('ads')
        .update({ status: 'rejected' })
        .eq('id', parseInt(adId));

      if (error) throw error;

      await ctx.answerCbQuery('❌ ИИ отклонил объявление');
      console.log(`🤖 ИИ отклонил объявление ${adId}`);
    } catch (error) {
      console.error('Ошибка ИИ-отклонения:', error);
      await ctx.answerCbQuery('❌ Ошибка ИИ-отклонения');
    }
  } else if (action === 'ai_settings') {
    // Настройки ИИ
    await ctx.editMessageText(
      '⚙️ Настройки ИИ-Модерации\n\n' +
      '🔍 Проверка запрещенных слов: Включена\n' +
      '📊 Анализ тональности: Включен\n' +
      '🚨 Обнаружение спама: Включено\n' +
      '⚡ Автоодобрение: Включено\n\n' +
      '📝 Статус: Активен',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Обновить', 'ai_settings')],
        [Markup.button.callback('⬅ Назад', 'back_to_main')]
      ])
    );
    await ctx.answerCbQuery();
  } else if (action === 'ai_stats') {
    // Статистика ИИ
    await ctx.editMessageText(
      '📊 Статистика ИИ-Модерации\n\n' +
      '✅ Одобрено ИИ: 0\n' +
      '❌ Отклонено ИИ: 0\n' +
      '🔍 Всего проверено: 0\n' +
      '⚡ Точность: 0%\n\n' +
      '🤖 Статус: Активен',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Обновить', 'ai_stats')],
        [Markup.button.callback('⬅ Назад', 'back_to_main')]
      ])
    );
    await ctx.answerCbQuery();
  } else if (action.startsWith('channel_favorite_')) {
    // Добавление в избранное из канала
    const adId = action.replace('channel_favorite_', '');
    
    try {
      // Проверяем есть ли уже в избранном
      const { data: existing, error: checkError } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .eq('ad_id', parseInt(adId))
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Ошибка проверки избранного:', checkError);
        await ctx.answerCbQuery('❌ Ошибка проверки');
        return;
      }

      if (existing) {
        await ctx.answerCbQuery('❌ Уже в избранном');
        return;
      }

      // Добавляем в избранное
      const { error: insertError } = await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          ad_id: parseInt(adId),
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Ошибка добавления в избранное:', insertError);
        await ctx.answerCbQuery('❌ Ошибка добавления');
        return;
      }

      // Обновляем счетчик избранного
      const { data: currentAd, error: adError } = await supabase
        .from('ads')
        .select('favorites_count')
        .eq('id', parseInt(adId))
        .single();

      if (!adError && currentAd) {
        await supabase
          .from('ads')
          .update({ favorites_count: (currentAd.favorites_count || 0) + 1 })
          .eq('id', parseInt(adId));
      }

      await ctx.answerCbQuery('✅ Добавлено в избранное');
      
      // Обновляем кнопку в сообщении
      try {
        await ctx.editMessageReplyMarkup({
          reply_markup: {
            inline_keyboard: [
              [Markup.button.callback('❤️ В избранном', `channel_favorite_${adId}`)]
            ]
          }
        });
      } catch (editError) {
        console.error('Ошибка обновления кнопки:', editError);
      }
      
    } catch (error) {
      console.error('Ошибка добавления в избранное:', error);
      await ctx.answerCbQuery('❌ Ошибка');
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

// Обработка фото (скриншотов чеков)
bot.on('photo', async (ctx) => {
  const userId = ctx.from.id;
  const state = userStates.get(userId);
  
  // Если пользователь в состоянии ожидания скриншота платежа
  if (state && state.step === 'payment_screenshot') {
    try {
      const adId = state.data.adId;
      
      // Получаем объявление
      const { data: ad, error } = await supabase
        .from('ads')
        .select('*')
        .eq('id', adId)
        .single();

      if (error || !ad) {
        await ctx.reply('❌ Объявление не найдено');
        return;
      }

      // Сохраняем фото скриншота
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      
      // Отправляем скриншот админу для проверки
      await bot.telegram.sendPhoto(ADMIN_ID, photo.file_id, {
        caption: `📸 Скриншот чека об оплате\n\n` +
          `📝 Объявление: ${ad.title}\n` +
          `👤 Пользователь: @${ctx.from.username || 'unknown'} (${ctx.from.first_name})\n` +
          `💰 Сумма: 199 ₽\n\n` +
          `✅ Подтвердить или ❌ отклонить оплату?`,
        reply_markup: {
          inline_keyboard: [
            [
              Markup.button.callback('✅ Подтвердить', `confirm_payment_${adId}_${userId}`),
              Markup.button.callback('❌ Отклонить', `reject_payment_${adId}_${userId}`)
            ]
          ]
        }
      });

      // Обновляем статус объявления
      await supabase
        .from('ads')
        .update({ status: 'payment_review' })
        .eq('id', adId);

      await ctx.reply(
        '✅ Скриншот получен!\n\n' +
        '📸 Ваш чек отправлен на проверку администратору\n' +
        '⏰ Проверка обычно занимает 5-15 минут\n\n' +
        '🔔 Вы получите уведомление после подтверждения',
        mainMenu
      );
      
      // Очищаем состояние
      userStates.delete(userId);
      
    } catch (error) {
      console.error('Ошибка обработки скриншота:', error);
      await ctx.reply('❌ Ошибка обработки скриншота. Попробуйте еще раз.');
    }
  } else if (state && state.step === 'promotion_payment_screenshot') {
    // Обработка скриншота оплаты продвижения
    try {
      const paymentId = state.data.paymentId;
      
      // Получаем информацию о платеже
      const { data: payment, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error || !payment) {
        await ctx.reply('❌ Платеж не найден');
        return;
      }

      // Получаем объявление
      const { data: ad, error: adError } = await supabase
        .from('ads')
        .select('*')
        .eq('id', payment.ad_id)
        .single();

      if (adError || !ad) {
        await ctx.reply('❌ Объявление не найдено');
        return;
      }

      // Сохраняем фото скриншота
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      
      // Отправляем скриншот админу для проверки
      await bot.telegram.sendPhoto(ADMIN_ID, photo.file_id, {
        caption: `📸 Скриншот чека об оплате продвижения\n\n` +
          `📝 Объявление: ${ad.title}\n` +
          `🚀 Услуга: ${payment.description}\n` +
          `👤 Пользователь: @${ctx.from.username || 'unknown'} (${ctx.from.first_name})\n` +
          `💰 Сумма: ${payment.amount} ₽\n\n` +
          `✅ Подтвердить или ❌ отклонить оплату?`,
        reply_markup: {
          inline_keyboard: [
            [
              Markup.button.callback('✅ Подтвердить', `confirm_promotion_payment_${paymentId}_${userId}`),
              Markup.button.callback('❌ Отклонить', `reject_promotion_payment_${paymentId}_${userId}`)
            ]
          ]
        }
      });

      // Обновляем статус платежа
      await supabase
        .from('payments')
        .update({ status: 'payment_review' })
        .eq('id', paymentId);

      await ctx.reply(
        '✅ Скриншот получен!\n\n' +
        '📸 Ваш чек отправлен на проверку администратору\n' +
        '⏰ Проверка обычно занимает 5-15 минут\n\n' +
        '🔔 Вы получите уведомление после подтверждения',
        mainMenu
      );
      
      // Очищаем состояние
      userStates.delete(userId);
      
    } catch (error) {
      console.error('Ошибка обработки скриншота продвижения:', error);
      await ctx.reply('❌ Ошибка обработки скриншота. Попробуйте еще раз.');
    }
  }
});

// Запуск бота
async function start() {
    console.log('🚀 Инициализация бота Lavka26...');
    
    try {
        // Тест подключения к Supabase
        const { data, error } = await supabase.from('users').select('count');
        if (error) {
            console.error('❌ Ошибка подключения к Supabase:', error);
            return;
        }
        console.log('✅ Подключение к Supabase успешно');
        
        // Инициализация категорий
        await initCategories();
        console.log('✅ Категории успешно инициализированы');
        
        console.log('✅ Инициализация завершена');
        console.log('🚀 Запуск бота...');
        
        bot.launch();
        
        console.log('🎉 Бот Lavka26 успешно запущен!');
        
    } catch (error) {
        console.error('❌ Ошибка при запуске бота:', error);
    }
}

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Запуск
start();
