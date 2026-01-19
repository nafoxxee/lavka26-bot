require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

// Конфигурация
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const ADMIN_ID = 379036860; // Ваш ID - теперь модератор
const CHANNEL_ID = '@lavka26city';

const FREE_ADS_LIMIT = 5;
const AD_PRICE = 100;
const PROMOTION_PRICES = {
    boost_day: 50,
    boost_week: 200,
    boost_month: 500,
    pin_month: 500
};

// Инициализация
const bot = new Telegraf(BOT_TOKEN);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Состояния пользователей
const userStates = new Map();

// Главное меню
const mainMenu = Markup.keyboard([
    ['📄 Смотреть объявления'],
    ['➕ Создать объявление'],
    ['❤️ Избранное', '🔍 Поиск'],
    ['⚙ Настройки']
]).resize();

// Главное меню для админа
const adminMenu = Markup.keyboard([
    ['📄 Смотреть объявления'],
    ['➕ Создать объявление'],
    ['❤️ Избранное', '🔍 Поиск'],
    ['⚙ Настройки', '🔧 Модерация']
]).resize();

// Категории
const categoriesKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🚗 Транспорт', 'category_transport')],
    [Markup.button.callback('🏠 Недвижимость', 'category_real_estate')],
    [Markup.button.callback('💼 Работа', 'category_jobs')],
    [Markup.button.callback('🛠 Услуги', 'category_services')],
    [Markup.button.callback('👕 Личные вещи', 'category_personal')],
    [Markup.button.callback('📱 Электроника', 'category_electronics')],
    [Markup.button.callback('🌿 Дом и сад', 'category_home_garden')],
    [Markup.button.callback('🐶 Животные', 'category_animals')],
    [Markup.button.callback('🎮 Хобби и отдых', 'category_hobby')],
    [Markup.button.callback('🏭 Для бизнеса', 'category_business')],
    [Markup.button.callback('💄 Красота и здоровье', 'category_beauty')],
    [Markup.button.callback('✈ Билеты и путешествия', 'category_travel')],
    [Markup.button.callback('🏗 Строительство и ремонт', 'category_construction')],
    [Markup.button.callback('📦 Прочее', 'category_other')],
    [Markup.button.callback('⬅ Назад', 'back_to_main')]
]);

// Инициализация категорий
async function initCategories() {
    const categories = [
        { name: 'Транспорт', emoji: '🚗', order: 1 },
        { name: 'Недвижимость', emoji: '🏠', order: 2 },
        { name: 'Работа', emoji: '💼', order: 3 },
        { name: 'Услуги', emoji: '🛠', order: 4 },
        { name: 'Личные вещи', emoji: '👕', order: 5 },
        { name: 'Электроника', emoji: '📱', order: 6 },
        { name: 'Дом и сад', emoji: '🌿', order: 7 },
        { name: 'Животные', emoji: '🐶', order: 8 },
        { name: 'Хобби и отдых', emoji: '🎮', order: 9 },
        { name: 'Для бизнеса', emoji: '🏭', order: 10 },
        { name: 'Красота и здоровье', emoji: '💄', order: 11 },
        { name: 'Билеты и путешествия', emoji: '✈', order: 12 },
        { name: 'Строительство и ремонт', emoji: '🏗', order: 13 },
        { name: 'Прочее', emoji: '📦', order: 14 }
    ];

    for (const category of categories) {
        const { data: existing } = await supabase
            .from('categories')
            .select('*')
            .eq('name', category.name)
            .single();

        if (!existing) {
            await supabase.from('categories').insert(category);
        }
    }
}

// Получить или создать пользователя
async function getOrCreateUser(ctx) {
    const telegramId = ctx.from.id;
    
    let { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();

    if (!user) {
        const { data: newUser } = await supabase
            .from('users')
            .insert({
                telegram_id: telegramId,
                username: ctx.from.username,
                first_name: ctx.from.first_name,
                last_name: ctx.from.last_name
            })
            .select()
            .single();
        
        user = newUser;
    }

    return user;
}

// Команда /start
bot.start(async (ctx) => {
    const welcomeText = `👋 Добро пожаловать в Lavka26
Торговая площадка объявлений города Михайловска

Выберите действие в меню ниже:`;

    // Показываем разное меню для админа
    const menu = ctx.from.id === ADMIN_ID ? adminMenu : mainMenu;
    await ctx.reply(welcomeText, menu);
});

// Команда /promotion для продвижения объявлений
bot.command('promotion', async (ctx) => {
    try {
        const user = await getOrCreateUser(ctx);
        
        // Получаем активные объявления пользователя
        const { data: ads, error } = await supabase
            .from('ads')
            .select('id, title, created_at')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Ошибка загрузки объявлений для продвижения:', error);
            await ctx.reply('❌ Ошибка загрузки объявлений');
            return;
        }

        if (ads.length === 0) {
            await ctx.reply('🚀 У вас нет активных объявлений для продвижения\n\n' +
                'Сначала создайте объявление, а затем продвигайте его!');
            return;
        }

        let promotionText = `🚀 Продвижение объявлений\n\n` +
            `Ваши активные объявления (${ads.length}):\n\n`;
        
        ads.forEach((ad, index) => {
            promotionText += `${index + 1}. 📝 ${ad.title}\n`;
            promotionText += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n\n`;
        });

        promotionText += `Выберите объявление для продвижения:`;

        const adButtons = ads.map(ad => [
            Markup.button.callback(`📝 ${ad.title}`, `select_promote_${ad.id}`)
        ]);

        adButtons.push([Markup.button.callback('⬅ Назад', 'back_to_main')]);

        await ctx.reply(promotionText, Markup.inlineKeyboard(adButtons));
    } catch (error) {
        console.error('Ошибка в команде promotion:', error);
        await ctx.reply('❌ Ошибка при загрузке объявлений');
    }
});

// Команда для архива
bot.command('archive', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.reply('❌ Эта команда доступна только модератору');
        return;
    }

    try {
        const { data: ads, error } = await supabase
            .from('ads')
            .select(`
                *,
                users!inner(username, first_name)
            `)
            .eq('status', 'archived')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Ошибка загрузки архива:', error);
            await ctx.reply('❌ Ошибка загрузки архива');
            return;
        }

        if (ads.length === 0) {
            await ctx.reply('📁 В архиве нет объявлений');
        } else {
            let archiveText = `📁 Архив объявлений (${ads.length}):\n\n`;
            
            ads.forEach((ad, index) => {
                archiveText += `${index + 1}. 📝 ${ad.title}\n`;
                archiveText += `💰 ${ad.price} ₽\n`;
                archiveText += `👤 @${ad.users.username || 'unknown'}\n`;
                archiveText += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n\n`;
            });

            await ctx.reply(archiveText);
        }
    } catch (error) {
        console.error('Ошибка в команде archive:', error);
        await ctx.reply('❌ Ошибка при загрузке архива');
    }
});

// Показать категории
async function showCategories(ctx) {
    try {
        // Получаем категории из базы
        const { data: categories, error } = await supabase
            .from('categories')
            .select('*')
            .order('id');

        if (error) {
            console.error('Ошибка загрузки категорий:', error);
            await ctx.reply('Ошибка загрузки категорий', mainMenu);
            return;
        }

        // Создаем клавиатуру с категориями
        const categoryButtons = categories.map(cat => [
            Markup.button.callback(cat.name, `category_${cat.name.toLowerCase()}`)
        ]);

        await ctx.reply('Выберите категорию:', {
            reply_markup: {
                inline_keyboard: categoryButtons
            }
        });
    } catch (error) {
        console.error('Ошибка в showCategories:', error);
        await ctx.reply('Ошибка загрузки категорий', mainMenu);
    }
}

// Создать объявление
async function createAdStart(ctx) {
    const userId = ctx.from.id;
    userStates.set(userId, {
        step: 'photo',
        data: {}
    });

    await ctx.reply(
        'Создание объявления - Шаг 1\n\n' +
        '📸 Отправьте фото (можно несколько)\n' +
        'Когда закончите, нажмите кнопку "Далее"',
        Markup.keyboard([
            ['Далее', '❌ Отмена']
        ]).resize()
    );
}

// Обработка фото
bot.on('photo', async (ctx) => {
    const userId = ctx.from.id;
    const state = userStates.get(userId);

    if (!state || state.step !== 'photo') return;

    if (!state.data.photos) {
        state.data.photos = [];
    }

    const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    state.data.photos.push(photoId);

    await ctx.reply(
        `Фото добавлено (${state.data.photos.length})\n` +
        'Добавьте еще фото или нажмите кнопку "Далее"',
        Markup.keyboard([
            ['Далее', '❌ Отмена']
        ]).resize()
    );
});

// Команда "далее" - только для пользователей в процессе создания
bot.hears('далее', async (ctx) => {
    const userId = ctx.from.id;
    const state = userStates.get(userId);

    if (!state) {
        await ctx.reply('Эта команда доступна только при создании объявления', mainMenu);
        return;
    }

    if (state.step === 'photo') {
        state.step = 'title';
        await ctx.reply('Создание объявления - Шаг 2\n\n📝 Введите название объявления:');
    } else if (state.step === 'location') {
        // Пропускаем геолокацию
        console.log('Пропуск геолокации, переходим к публикации');
        await publishAd(ctx, await getOrCreateUser(ctx), state.data);
        userStates.delete(userId);
    }
});

// Команда /next - для обратной совместимости
bot.command('next', async (ctx) => {
    const userId = ctx.from.id;
    const state = userStates.get(userId);

    if (!state) {
        await ctx.reply('Эта команда доступна только при создании объявления', mainMenu);
        return;
    }

    if (state.step === 'photo') {
        state.step = 'title';
        await ctx.reply('Создание объявления - Шаг 2\n\n📝 Введите название объявления:');
    } else if (state.step === 'location') {
        // Пропускаем геолокацию
        console.log('Пропуск геолокации, переходим к публикации');
        await publishAd(ctx, await getOrCreateUser(ctx), state.data);
        userStates.delete(userId);
    }
});

// Обработка геолокации
bot.on('location', async (ctx) => {
    const userId = ctx.from.id;
    const state = userStates.get(userId);

    console.log('Получена геолокация от пользователя:', userId);
    console.log('Состояние пользователя:', state);

    if (!state || state.step !== 'location') {
        console.log('Геолокация проигнорирована - неверный шаг');
        return;
    }

    state.data.location = {
        latitude: ctx.message.location.latitude,
        longitude: ctx.message.location.longitude
    };

    console.log('Геолокация получена и сохранена:', state.data.location);
    console.log('Все данные объявления:', state.data);

    // Проверка лимита объявлений
    try {
        const user = await getOrCreateUser(ctx);
        console.log('Пользователь получен:', user);
        
        const limitInfo = await checkFreeAdsLimit(user.id);
        console.log('Информация о лимите:', limitInfo);

        if (!limitInfo.canPost) {
            await sendLimitNotification(ctx, limitInfo);
            return;
        }

        console.log('Переходим к публикации объявления');
        await publishAd(ctx, user, state.data);
        userStates.delete(userId);
    } catch (error) {
        console.error('Ошибка при получении пользователя:', error);
        await ctx.reply('❌ Ошибка при обработке пользователя');
    }
});

// Публикация объявления
async function publishAd(ctx, user, adData) {
    try {
        console.log('Начинаем публикацию объявления');
        console.log('Данные объявления:', adData);
        console.log('Пользователь:', user);

        // Проверяем обязательные поля
        if (!adData.title || !adData.description || !adData.price) {
            console.error('Отсутствуют обязательные поля:', {
                title: !!adData.title,
                description: !!adData.description,
                price: !!adData.price
            });
            await ctx.reply('❌ Отсутствуют обязательные поля объявления');
            return;
        }

        // Получаем ID категории из данных
        let categoryId = 1; // по умолчанию
        
        if (adData.category) {
            console.log('Ищем категорию:', adData.category);
            
            // Извлекаем ID категории из строки типа "category_transport"
            const categoryMap = {
                'category_transport': 1,
                'category_real_estate': 2,
                'category_jobs': 3,
                'category_services': 4,
                'category_personal': 5,
                'category_electronics': 6,
                'category_home_garden': 7,
                'category_animals': 8,
                'category_hobby': 9,
                'category_business': 10,
                'category_beauty': 11,
                'category_travel': 12,
                'category_construction': 13,
                'category_other': 14
            };
            categoryId = categoryMap[adData.category] || 1;
            console.log('ID категории:', categoryId);
        }

        // Подготавливаем данные для вставки
        const adInsertData = {
            user_id: user.id,
            category_id: categoryId,
            title: adData.title,
            description: adData.description,
            price: adData.price,
            photos: adData.photos || [],
            status: 'moderation' // Отправляем на модерацию
        };

        // Добавляем геолокацию если есть
        if (adData.location) {
            adInsertData.location = adData.location;
        }

        console.log('Данные для вставки:', adInsertData);

        const { data: ad, error } = await supabase
            .from('ads')
            .insert(adInsertData)
            .select()
            .single();

        if (error) {
            console.error('Ошибка при вставке объявления:', error);
            console.error('Детали ошибки:', {
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            throw error;
        }

        console.log('Объявление успешно создано:', ad);

        if (ad) {
            // Отправляем уведомление админу о новом объявлении
            await notifyAdminAboutNewAd(ad);
            
            await ctx.reply(
                '✅ Объявление отправлено на модерацию!\n\n' +
                '📋 Ваше объявление будет проверено модератором в ближайшее время.\n' +
                '⏰ Обычно проверка занимает от 5 минут до 1 часа.\n\n' +
                '🔔 Вы получите уведомление о публикации.',
                Markup.inlineKeyboard([
                    [Markup.button.callback('🏠 Главное меню', 'back_to_main')]
                ])
            );
        } else {
            await ctx.reply('❌ Ошибка при публикации объявления. Попробуйте еще раз.');
        }
    } catch (error) {
        console.error('Ошибка в publishAd:', error);
        await ctx.reply('❌ Ошибка при публикации объявления. Попробуйте еще раз.');
    }
}
// Уведомление админа о новом объявлении
async function notifyAdminAboutNewAd(ad) {
    try {
        // Получаем информацию о пользователе
        const { data: user } = await supabase
            .from('users')
            .select('username, first_name')
            .eq('id', ad.user_id)
            .single();

        let adminText = `🔔 Новое объявление на модерации!\n\n`;
        adminText += `📝 ${ad.title}\n`;
        adminText += `💰 ${ad.price} ₽\n`;
        adminText += `👤 @${user?.username || 'unknown'} (${user?.first_name})\n`;
        adminText += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n\n`;
        adminText += `🔧 Модерация → Просмотреть`;

        await bot.telegram.sendMessage(ADMIN_ID, adminText, Markup.inlineKeyboard([
            [Markup.button.callback('🔧 Открыть модерацию', 'open_moderation')]
        ]));
    } catch (error) {
        console.error('Ошибка отправки уведомления админу:', error);
    }
}

// Система продвижения объявлений
async function showPromotionOptions(ctx, adId) {
    const promotionText = `🚀 Продвижение объявления\n\n` +
        `Выберите пакет продвижения:\n\n` +
        `⭐ VIP на 1 день - ${PROMOTION_PRICES.boost_day} ₽\n` +
        `   • Закрепление вверху канала\n` +
        `   • Выделение цветом\n\n` +
        `⭐ VIP на 7 дней - ${PROMOTION_PRICES.boost_week} ₽\n` +
        `   • Закрепление на неделю\n` +
        `   • Выделение цветом\n\n` +
        `⭐ VIP на месяц - ${PROMOTION_PRICES.boost_month || 500} ₽\n` +
        `   • Закрепление на месяц\n` +
        `   • Выделение цветом\n\n` +
        `💳 Оплата через Telegram Payments`;

    const buttons = [
        [
            Markup.button.callback('⭐ VIP на 1 день', `promote_${adId}_day`),
            Markup.button.callback('⭐ VIP на 7 дней', `promote_${adId}_week`)
        ],
        [
            Markup.button.callback('⭐ VIP на месяц', `promote_${adId}_month`),
            Markup.button.callback('⬅ Назад', 'back_to_main')
        ]
    ];

    await ctx.reply(promotionText, Markup.inlineKeyboard(buttons));
}

// Проверка лимита бесплатных объявлений
async function checkFreeAdsLimit(userId) {
    try {
        const { data: activeAds, error } = await supabase
            .from('ads')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'active');

        if (error) {
            console.error('Ошибка проверки лимита:', error);
            return { canPost: false, remaining: 0 };
        }

        const remaining = FREE_ADS_LIMIT - activeAds.length;
        return { 
            canPost: remaining > 0, 
            remaining: Math.max(0, remaining),
            used: activeAds.length
        };
    } catch (error) {
        console.error('Ошибка проверки лимита:', error);
        return { canPost: false, remaining: 0 };
    }
}

// Отправка уведомления о лимите
async function sendLimitNotification(ctx, limitInfo) {
    const limitText = `📊 Лимит бесплатных объявлений\n\n` +
        `Использовано: ${limitInfo.used}/${FREE_ADS_LIMIT}\n` +
        `Осталось: ${limitInfo.remaining}\n\n` +
        `💡 Для размещения еще объявлений:\n` +
        `• Ожидайте сброса лимита (ежемесячно)\n` +
        `• Или используйте платное продвижение\n\n` +
        `🚀 Узнать о продвижении → /promotion`;

    await ctx.reply(limitText);
}
async function notifyUserAboutModeration(userId, adId, status, reason = null) {
    try {
        const { data: ad } = await supabase
            .from('ads')
            .select('title')
            .eq('id', adId)
            .single();

        let notificationText = '';
        if (status === 'active') {
            notificationText = `✅ Ваше объявление одобрено!\n\n`;
            notificationText += `📝 ${ad.title}\n`;
            notificationText += `📢 Объявление опубликовано в канале @lavka26city\n\n`;
            notificationText += `Спасибо за использование Lavka26! 🎉`;
        } else if (status === 'archived') {
            notificationText = `❌ Ваше объявление отклонено\n\n`;
            notificationText += `📝 ${ad.title}\n`;
            if (reason) {
                notificationText += `📝 Причина: ${reason}\n\n`;
            }
            notificationText += `Вы можете исправить объявление и отправить повторно`;
        }

        await bot.telegram.sendMessage(userId, notificationText);
    } catch (error) {
        console.error('Ошибка отправки уведомления пользователю:', error);
    }
}
async function sendAdToChannel(ctx, ad) {
    try {
        // Получаем информацию о пользователе для ссылки
        const { data: adUser } = await supabase
            .from('users')
            .select('username')
            .eq('id', ad.user_id)
            .single();

        let text = `📝 ${ad.title}\n\n`;
        text += `${ad.description}\n\n`;
        text += `💰 ${ad.price} ₽\n`;
        
        // Добавляем геолокацию если есть
        if (ad.location) {
            text += `📍 [Показать на карте](https://maps.google.com/?q=${ad.location.latitude},${ad.location.longitude})\n`;
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

        console.log('✅ Объявление успешно отправлено в канал');
    } catch (error) {
        console.error('Ошибка отправки в канал:', error);
    }
}

// Обработка кнопок главного меню
bot.hears('📄 Смотреть объявления', showCategories);
bot.hears('➕ Создать объявление', createAdStart);
bot.hears('❌ Отмена', async (ctx) => {
    const userId = ctx.from.id;
    userStates.delete(userId);
    const menu = ctx.from.id === ADMIN_ID ? adminMenu : mainMenu;
    await ctx.reply('❌ Создание объявления отменено', menu);
});

// Обработка кнопки модерации
bot.hears('🔧 Модерация', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.reply('❌ Эта функция доступна только модератору');
        return;
    }

    try {
        const { data: ads, error } = await supabase
            .from('ads')
            .select(`
                *,
                users!inner(username, first_name)
            `)
            .eq('status', 'moderation')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Ошибка загрузки объявлений на модерацию:', error);
            await ctx.reply('❌ Ошибка загрузки объявлений');
            return;
        }

        if (ads.length === 0) {
            await ctx.reply('📋 Объявлений на модерации нет', adminMenu);
        } else {
            // Показываем объявления по одному с кнопками
            await showModerationAd(ctx, ads, 0);
        }
    } catch (error) {
        console.error('Ошибка в модерации:', error);
        await ctx.reply('❌ Ошибка при загрузке объявлений');
    }
});

// Функция показа объявления на модерации
async function showModerationAd(ctx, ads, index) {
    if (index >= ads.length) {
        await ctx.reply('📋 Все объявления просмотрены', adminMenu);
        return;
    }

    const ad = ads[index];
    const user = ad.users;
    
    let text = `📋 Объявление ${index + 1}/${ads.length} на модерации\n\n`;
    text += `📝 ${ad.title}\n\n`;
    text += `${ad.description}\n\n`;
    text += `💰 ${ad.price} ₽\n`;
    text += `👤 @${user.username || 'unknown'} (${user.first_name})\n`;
    text += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n`;
    
    if (ad.location) {
        text += `📍 [Показать на карте](https://maps.google.com/?q=${ad.location.latitude},${ad.location.longitude})\n`;
    }

    const buttons = [
        [
            Markup.button.callback('✅ Одобрить', `moderate_approve_${ad.id}_${index}`),
            Markup.button.callback('❌ Отклонить', `moderate_reject_${ad.id}_${index}`),
            Markup.button.callback('⏭ Пропустить', `moderate_skip_${index}`),
        ],
        [
            Markup.button.callback('❌ Закрыть', 'back_to_main')
        ]
    ];

    // Если есть фото, отправляем вместе с текстом
    if (ad.photos && ad.photos.length > 0) {
        await ctx.replyWithPhoto(ad.photos[0], {
            caption: text,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: buttons }
        });
    } else {
        await ctx.reply(text, Markup.inlineKeyboard(buttons));
    }
}

// Обработка кнопок меню (не в процессе создания)
bot.hears('❤️ Избранное', async (ctx) => {
    const userId = ctx.from.id;
    const state = userStates.get(userId);
    
    if (!state) {
        try {
            const user = await getOrCreateUser(ctx);
            
            // Получаем избранные объявления
            const { data: favorites, error } = await supabase
                .from('favorites')
                .select(`
                    *,
                    ads!inner(
                        id,
                        title,
                        price,
                        photos,
                        created_at,
                        users!inner(username, first_name)
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Ошибка загрузки избранного:', error);
                const menu = ctx.from.id === ADMIN_ID ? adminMenu : mainMenu;
                await ctx.reply('❌ Ошибка загрузки избранного', menu);
                return;
            }

            if (favorites.length === 0) {
                const menu = ctx.from.id === ADMIN_ID ? adminMenu : mainMenu;
                await ctx.reply('❤️ Ваши избранные объявления:\n\n(Пусто)', menu);
            } else {
                let favoriteText = `❤️ Ваши избранные объявления (${favorites.length}):\n\n`;
                
                favorites.forEach((fav, index) => {
                    const ad = fav.ads;
                    favoriteText += `${index + 1}. 📝 ${ad.title}\n`;
                    favoriteText += `💰 ${ad.price} ₽\n`;
                    favoriteText += `👤 @${ad.users.username || 'unknown'}\n`;
                    favoriteText += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n\n`;
                });

                // Создаем кнопки для каждого объявления
                const favoriteButtons = favorites.map((fav, index) => {
                    const ad = fav.ads;
                    return [
                        Markup.button.callback(`📝 ${ad.title}`, `view_favorite_${ad.id}`),
                        Markup.button.callback('🗑 Удалить', `remove_favorite_${ad.id}`)
                    ];
                });

                favoriteButtons.push([Markup.button.callback('⬅ Назад', 'back_to_main')]);

                await ctx.reply(favoriteText, Markup.inlineKeyboard(favoriteButtons));
            }
        } catch (error) {
            console.error('Ошибка в избранном:', error);
            const menu = ctx.from.id === ADMIN_ID ? adminMenu : mainMenu;
            await ctx.reply('❌ Ошибка загрузки избранного', menu);
        }
    }
});

bot.hears('🔍 Поиск', async (ctx) => {
    const userId = ctx.from.id;
    const state = userStates.get(userId);
    
    if (!state) {
        // Устанавливаем состояние поиска
        userStates.set(userId, {
            step: 'search',
            data: {}
        });
        const menu = ctx.from.id === ADMIN_ID ? adminMenu : mainMenu;
        await ctx.reply(
            '🔍 Введите слово для поиска:\n(например: айфон, диван, работа)',
            Markup.keyboard([['❌ Отмена']]).resize()
        );
    }
});

bot.hears('⚙ Настройки', async (ctx) => {
    const userId = ctx.from.id;
    const state = userStates.get(userId);
    
    if (!state) {
        await ctx.reply(
            '⚙ Настройки Lavka26\n\n' +
            '📄 Мои объявления\n' +
            '🔔 Уведомления\n' +
            '💳 История оплат\n' +
            '📞 Поддержка',
            Markup.inlineKeyboard([
                [Markup.button.callback('📄 Мои объявления', 'my_ads')],
                [Markup.button.callback('⬅ Назад', 'back_to_main')]
            ])
        );
    }
});

// Обработка текстовых сообщений для шагов создания и поиска
bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const state = userStates.get(userId);
    const text = ctx.message.text;

    // Если нет состояния - игнорируем (кнопки уже обработаны выше)
    if (!state) return;

    // Обработка ввода причины отклонения
    if (state.step === 'reject_reason') {
        const { adId, index } = state.data;
        
        try {
            // Обновляем статус объявления
            const { error } = await supabase
                .from('ads')
                .update({ status: 'archived' })
                .eq('id', adId);

            if (error) {
                console.error('Ошибка отклонения:', error);
                await ctx.reply('❌ Ошибка отклонения объявления');
                return;
            }

            // Получаем информацию об объявлении для уведомления
            const { data: ad } = await supabase
                .from('ads')
                .select('user_id')
                .eq('id', adId)
                .single();

            // Отправляем уведомление пользователю
            await notifyUserAboutModeration(ad.user_id, adId, 'archived', text);

            await ctx.reply('✅ Объявление отклонено с причиной: ' + text);
            
            // Очищаем состояние
            userStates.delete(userId);
            
            // Показываем следующее объявление
            const { data: remainingAds } = await supabase
                .from('ads')
                .select(`
                    *,
                    users!inner(username, first_name)
                `)
                .eq('status', 'moderation')
                .order('created_at', { ascending: false });

            await showModerationAd(ctx, remainingAds, index);
        } catch (error) {
            console.error('Ошибка при отклонении:', error);
            await ctx.reply('❌ Ошибка при отклонении объявления');
        }
        return;
    }

    // Обработка кнопки "Далее"
    if (text === 'Далее') {
        if (state.step === 'photo') {
            state.step = 'title';
            await ctx.reply('Создание объявления - Шаг 2\n\n📝 Введите название объявления:');
        } else if (state.step === 'location') {
            // Пропускаем геолокацию
            console.log('Нажата кнопка Далее - пропуск геолокации, переходим к публикации');
            await publishAd(ctx, await getOrCreateUser(ctx), state.data);
            userStates.delete(userId);
        }
        return;
    }

    // Обработка поиска
    if (state.step === 'search') {
        try {
            const { data: ads, error } = await supabase
                .from('ads')
                .select(`
                    *,
                    users!inner(username, first_name)
                `)
                .or(`title.ilike.%${text}%,description.ilike.%${text}%`)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                console.error('Ошибка поиска:', error);
                await ctx.reply('❌ Ошибка поиска');
                return;
            }

            userStates.delete(userId); // Очищаем состояние поиска

            if (ads.length === 0) {
                await ctx.reply(
                    `🔍 Результаты поиска по запросу: "${text}"\n\n📭 Ничего не найдено`,
                    mainMenu
                );
            } else {
                let searchResults = `🔍 Результаты поиска по запросу: "${text}"\n\n`;
                
                ads.forEach((ad, index) => {
                    searchResults += `${index + 1}. 📝 ${ad.title}\n`;
                    searchResults += `💰 ${ad.price} ₽\n`;
                    searchResults += `👤 @${ad.users.username || 'unknown'}\n`;
                    searchResults += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n\n`;
                });

                await ctx.reply(searchResults, mainMenu);
            }
        } catch (error) {
            console.error('Ошибка при поиске:', error);
            await ctx.reply('❌ Ошибка при поиске', mainMenu);
        }
        return;
    }

    // Обработка шагов создания объявления
    switch (state.step) {
        case 'title':
            state.data.title = text;
            state.step = 'description';
            await ctx.reply(
                'Создание объявления - Шаг 3\n\n📝 Введите описание объявления:',
                Markup.keyboard([
                    ['Далее', '❌ Отмена']
                ]).resize()
            );
            break;
        case 'description':
            state.data.description = text;
            state.step = 'category';
            await ctx.reply(
                'Создание объявления - Шаг 4\n\n📂 Выберите категорию:',
                categoriesKeyboard
            );
            break;
        case 'price':
            // Обработка цены
            console.log('Получен текст для цены:', text);
            const price = parseFloat(text);
            if (!isNaN(price) && price > 0) {
                state.data.price = price;
                state.step = 'location';
                console.log('Цена установлена:', price, 'Переход к шагу location');
                await ctx.reply(
                    'Создание объявления - Шаг 6\n\n' +
                    '📍 Отправьте геопозицию (нажмите кнопку ниже)\n\n' +
                    'Или нажмите кнопку "Далее" для пропуска',
                    Markup.keyboard([
                        [Markup.button.locationRequest('📍 Отправить геопозицию')],
                        ['Далее', '❌ Отмена']
                    ]).resize()
                );
            } else {
                console.log('Ошибка формата цены:', text);
                await ctx.reply('❌ Неверный формат цены. Введите положительное число:');
            }
            break;
    }
});

// Обработка inline кнопок
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
    // НЕ отправляем отдельное сообщение - это вызывает дублирование
  } else if (action.startsWith('category_')) {
    // Просмотр категории
    try {
        const categoryName = action.replace('category_', '');
        console.log('Ищем категорию:', categoryName);
        
        // Получаем категорию по имени или ID
        const { data: category } = await supabase
            .from('categories')
            .select('*')
            .or(`name.ilike.%${categoryName}%,name.eq.${categoryName}`)
            .single();

        console.log('Найденная категория:', category);

        if (!category) {
            await ctx.editMessageText('❌ Категория не найдена');
            return;
        }

        // Получаем объявления из этой категории
        const { data: ads, error } = await supabase
            .from('ads')
            .select(`
                *,
                users!inner(username, first_name)
            `)
            .eq('category_id', category.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Ошибка загрузки объявлений:', error);
            await ctx.editMessageText('❌ Ошибка загрузки объявлений');
            return;
        }

        if (ads.length === 0) {
            await ctx.editMessageText(
                `📄 Объявления категории: ${category.name}\n\n` +
                '📭 Объявлений пока нет',
                Markup.inlineKeyboard([
                    [Markup.button.callback('⬅ Назад', 'back_to_main')]
                ])
            );
        } else {
            // Формируем текст с объявлениями
            let adsText = `📄 Объявления категории: ${category.name}\n\n`;
            
            ads.forEach((ad, index) => {
                adsText += `${index + 1}. 📝 ${ad.title}\n`;
                adsText += `💰 ${ad.price} ₽\n`;
                adsText += `👤 @${ad.users.username || 'unknown'}\n`;
                adsText += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n\n`;
            });

            // Создаем кнопки для каждого объявления
            const adButtons = ads.map((ad, index) => {
                const buttons = [
                    Markup.button.callback('❤️ В избранное', `favorite_${ad.id}`)
                ];
                
                // Если модератор - добавляем кнопки управления статусом
                if (ctx.from.id === ADMIN_ID) {
                    buttons.push(
                        Markup.button.callback('✅ Активно', `ad_status_${ad.id}_active`),
                        Markup.button.callback('📁 Архив', `ad_status_${ad.id}_archived`)
                    );
                } else {
                    // Для обычных пользователей добавляем кнопку связи с автором
                    buttons.push(
                        Markup.button.callback('📞 Написать автору', `contact_author_${ad.id}`)
                    );
                }
                
                return buttons;
            });

            // Добавляем кнопку назад
            adButtons.push([Markup.button.callback('⬅ Назад', 'back_to_main')]);

            await ctx.editMessageText(
                adsText,
                Markup.inlineKeyboard(adButtons)
            );
        }
    } catch (error) {
        console.error('Ошибка при просмотре категории:', error);
        await ctx.editMessageText('❌ Ошибка при загрузке объявлений');
    }
  } else if (action.startsWith('select_promote_')) {
    // Выбор объявления для продвижения
    const adId = action.replace('select_promote_', '');
    await showPromotionOptions(ctx, adId);
  } else if (action.startsWith('promote_')) {
    // Обработка продвижения
    const parts = action.split('_');
    const adId = parseInt(parts[1]);
    const period = parts[2];
    
    try {
        const user = await getOrCreateUser(ctx);
        
        // Проверяем, что объявление принадлежит пользователю
        const { data: ad, error } = await supabase
            .from('ads')
            .select('*')
            .eq('id', adId)
            .eq('user_id', user.id)
            .single();

        if (error || !ad) {
            await ctx.answerCbQuery('❌ Объявление не найдено');
            return;
        }

        const prices = {
            day: PROMOTION_PRICES.boost_day,
            week: PROMOTION_PRICES.boost_week,
            month: PROMOTION_PRICES.boost_month
        };

        const price = prices[period];
        const periodText = {
            day: '1 день',
            week: '7 дней',
            month: 'месяц'
        };

        await ctx.answerCbQuery();
        
        // Создаем инвойс для оплаты
        const invoice = {
            chat_id: ctx.chat.id,
            description: `VIP продвижение объявления "${ad.title}" на ${periodText[period]}`,
            payload: `promotion_${adId}_${period}`,
            currency: 'RUB',
            prices: [{ label: `VIP ${periodText[period]}`, amount: price * 100 }], // в копейках
            provider_token: process.env.PAYMENT_PROVIDER_TOKEN
        };

        await ctx.replyWithInvoice(
            `💳 Оплата VIP продвижения\n\n` +
            `Объявление: ${ad.title}\n` +
            `Период: ${periodText[period]}\n` +
            `Стоимость: ${price} ₽`,
            invoice
        );
    } catch (error) {
        console.error('Ошибка в продвижении:', error);
        await ctx.answerCbQuery('❌ Ошибка создания платежа');
    }
  } else if (action === 'my_ads') {
    try {
      const user = await getOrCreateUser(ctx);
      
      const { data: ads, error } = await supabase
        .from('ads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка при загрузке моих объявлений:', error);
        await ctx.editMessageText('❌ Ошибка при загрузке объявлений');
        return;
      }

      if (ads.length === 0) {
        await ctx.editMessageText('📄 У вас пока нет объявлений\n\n➕ Создать объявление');
      } else {
        let adsText = `📄 Мои объявления (${ads.length}):\n\n`;
        
        ads.forEach((ad, index) => {
          const statusEmoji = ad.status === 'active' ? '✅' : 
                           ad.status === 'moderation' ? '🔄' : 
                           ad.status === 'archived' ? '📁' : '❓';
          
          adsText += `${index + 1}. ${statusEmoji} ${ad.title}\n`;
          adsText += `💰 ${ad.price} ₽\n`;
          adsText += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n\n`;
        });

        // Создаем кнопки для каждого объявления
        const adButtons = ads.map((ad, index) => [
          Markup.button.callback(`📝 ${ad.title}`, `manage_ad_${ad.id}`)
        ]);

        adButtons.push([Markup.button.callback('⬅ Назад', 'back_to_main')]);

        await ctx.editMessageText(
          adsText,
          Markup.inlineKeyboard(adButtons)
        );
      }
    } catch (error) {
      console.error('Ошибка при загрузке моих объявлений:', error);
      await ctx.editMessageText('❌ Ошибка при загрузке объявлений');
    }
  } else if (action.startsWith('manage_ad_')) {
    // Управление объявлением
    const adId = action.replace('manage_ad_', '');
    
    try {
      const user = await getOrCreateUser(ctx);
      
      const { data: ad, error } = await supabase
        .from('ads')
        .select('*')
        .eq('id', parseInt(adId))
        .eq('user_id', user.id)
        .single();

      if (error || !ad) {
        await ctx.answerCbQuery('❌ Объявление не найдено');
        return;
      }

      const statusEmoji = ad.status === 'active' ? '✅' : 
                       ad.status === 'moderation' ? '🔄' : 
                       ad.status === 'archived' ? '📁' : '❓';
      
      let adText = `${statusEmoji} Управление объявлением\n\n`;
      adText += `📝 ${ad.title}\n`;
      adText += `${ad.description}\n\n`;
      adText += `💰 ${ad.price} ₽\n`;
      adText += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n`;
      adText += `📊 Статус: ${ad.status}\n\n`;
      adText += `Выберите действие:`;

      const buttons = [];
      
      // Кнопки в зависимости от статуса
      if (ad.status === 'active') {
        buttons.push([
          Markup.button.callback('📁 Архивировать', `ad_action_${ad.id}_archived`),
          Markup.button.callback('✏️ Редактировать', `ad_action_${ad.id}_edit`)
        ]);
      } else if (ad.status === 'archived') {
        buttons.push([
          Markup.button.callback('✅ Активировать', `ad_action_${ad.id}_active`),
          Markup.button.callback('🗑 Удалить', `ad_action_${ad.id}_delete`)
        ]);
      } else if (ad.status === 'moderation') {
        buttons.push([
          Markup.button.callback('📋 На модерации', `ad_action_${ad.id}_info`)
        ]);
      }
      
      buttons.push([Markup.button.callback('⬅ Назад', 'my_ads')]);

      await ctx.editMessageText(adText, Markup.inlineKeyboard(buttons));
    } catch (error) {
      console.error('Ошибка управлении объявлением:', error);
      await ctx.answerCbQuery('❌ Ошибка');
    }
  } else if (action.startsWith('ad_action_')) {
    // Действия с объявлением
    const parts = action.split('_');
    const adId = parseInt(parts[2]);
    const actionType = parts[3];
    
    try {
      const user = await getOrCreateUser(ctx);
      
      // Проверяем, что объявление принадлежит пользователю
      const { data: ad, error } = await supabase
        .from('ads')
        .select('*')
        .eq('id', adId)
        .eq('user_id', user.id)
        .single();

      if (error || !ad) {
        await ctx.answerCbQuery('❌ Объявление не найдено');
        return;
      }

      if (actionType === 'archived') {
        // Архивировать
        const { error } = await supabase
          .from('ads')
          .update({ status: 'archived' })
          .eq('id', adId);

        if (error) {
          await ctx.answerCbQuery('❌ Ошибка архивации');
          return;
        }

        await ctx.answerCbQuery('📁 Объявление архивировано');
        await ctx.editMessageText('📁 Объявление отправлено в архив');
        
      } else if (actionType === 'active') {
        // Активировать
        const { error } = await supabase
          .from('ads')
          .update({ status: 'moderation' })
          .eq('id', adId);

        if (error) {
          await ctx.answerCbQuery('❌ Ошибка активации');
          return;
        }

        await ctx.answerCbQuery('✅ Объявление отправлено на модерацию');
        await ctx.editMessageText('✅ Объявление отправлено на модерацию');
        
      } else if (actionType === 'delete') {
        // Удалить
        const { error } = await supabase
          .from('ads')
          .delete()
          .eq('id', adId);

        if (error) {
          await ctx.answerCbQuery('❌ Ошибка удаления');
          return;
        }

        await ctx.answerCbQuery('🗑 Объявление удалено');
        await ctx.editMessageText('🗑 Объявление удалено');
        
      } else if (actionType === 'edit') {
        await ctx.answerCbQuery('✏️ Редактирование в разработке');
      } else if (actionType === 'info') {
        await ctx.answerCbQuery('📋 Объявление на модерации');
      }
      
    } catch (error) {
      console.error('Ошибка в действии с объявлением:', error);
      await ctx.answerCbQuery('❌ Ошибка');
    }
  } else if (action === 'create_ad') {
    await ctx.editMessageText('Выберите действие в меню ниже:');
    await createAdStart(ctx);
  } else if (action.startsWith('moderate_')) {
    // Обработка кнопок модерации
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('❌ Только для модератора');
        return;
    }

    const parts = action.split('_');
    const actionType = parts[1];
    const adId = parseInt(parts[2]);
    const index = parseInt(parts[3]);

    try {
        if (actionType === 'approve') {
            // Одобрить объявление
            const { error } = await supabase
                .from('ads')
                .update({ status: 'active' })
                .eq('id', adId);

            if (error) {
                console.error('Ошибка одобрения:', error);
                await ctx.answerCbQuery('❌ Ошибка одобрения');
                return;
            }

            await ctx.answerCbQuery('✅ Объявление одобрено');
            
            // Получаем объявление и отправляем в канал
            const { data: ad } = await supabase
                .from('ads')
                .select('*')
                .eq('id', adId)
                .single();
            
            if (ad && CHANNEL_ID) {
                await sendAdToChannel(ctx, ad);
            }

            // Отправляем уведомление пользователю
            await notifyUserAboutModeration(ad.user_id, adId, 'active');

            // Показываем следующее объявление
            const { data: remainingAds } = await supabase
                .from('ads')
                .select(`
                    *,
                    users!inner(username, first_name)
                `)
                .eq('status', 'moderation')
                .order('created_at', { ascending: false });

            await showModerationAd(ctx, remainingAds, index);

        } else if (actionType === 'reject') {
            // Отклонить объявление с комментарием
            await ctx.answerCbQuery('❌ Введите причину отклонения');
            
            // Устанавливаем состояние для ввода причины
            userStates.set(ctx.from.id, {
                step: 'reject_reason',
                data: { adId, index }
            });
            
            await ctx.reply(
                '📝 Введите причину отклонения объявления:\n\n' +
                'Примеры:\n' +
                '• Неправильная категория\n' +
                '• Недостаточно информации\n' +
                '• Нарушение правил площадки\n' +
                '• Некачественные фото',
                Markup.keyboard([['❌ Отмена']]).resize()
            );
            
        } else if (actionType === 'archive') {
            // Отправить в архив
            const { error } = await supabase
                .from('ads')
                .update({ status: 'archived' })
                .eq('id', adId);

            if (error) {
                console.error('Ошибка архивации:', error);
                await ctx.answerCbQuery('❌ Ошибка архивации');
                return;
            }

            await ctx.answerCbQuery('📁 Объявление отправлено в архив');

            // Показываем следующее объявление
            const { data: remainingAds } = await supabase
                .from('ads')
                .select(`
                    *,
                    users!inner(username, first_name)
                `)
                .eq('status', 'moderation')
                .order('created_at', { ascending: false });

            await showModerationAd(ctx, remainingAds, index);

        } else if (actionType === 'skip') {
            // Пропустить объявление
            await ctx.answerCbQuery('⏭ Объявление пропущено');
            
            const { data: remainingAds } = await supabase
                .from('ads')
                .select(`
                    *,
                    users!inner(username, first_name)
                `)
                .eq('status', 'moderation')
                .order('created_at', { ascending: false });

            await showModerationAd(ctx, remainingAds, index + 1);
        }
    } catch (error) {
        console.error('Ошибка в модерации:', error);
        await ctx.answerCbQuery('❌ Ошибка');
    }
  } else if (action.startsWith('ad_status_')) {
    // Изменение статуса объявления (старый метод - оставим для совместимости)
    if (ctx.from.id !== ADMIN_ID) {
        await ctx.answerCbQuery('❌ Только для модератора');
        return;
    }

    const statusParts = action.split('_');
    const statusAdId = statusParts[2];
    const newStatus = statusParts[3];
    
    console.log('Попытка изменить статус объявления:', statusAdId, 'на:', newStatus);
    
    try {
        const { error } = await supabase
            .from('ads')
            .update({ status: newStatus })
            .eq('id', parseInt(statusAdId));

        if (error) {
            console.error('Ошибка обновления статуса:', error);
            await ctx.answerCbQuery('❌ Ошибка обновления статуса');
            return;
        }

        let statusText = newStatus === 'active' ? '✅ Одобрено' : 
                        newStatus === 'archived' ? '📁 В архиве' : '🔄 На модерации';
        
        await ctx.answerCbQuery(`Статус изменен: ${statusText}`);
        
        // Если объявление одобрено, отправляем в канал
        if (newStatus === 'active') {
            const { data: ad } = await supabase
                .from('ads')
                .select('*')
                .eq('id', parseInt(statusAdId))
                .single();
            
            if (ad && CHANNEL_ID) {
                await sendAdToChannel(ctx, ad);
            }
        }
    } catch (error) {
        console.error('Ошибка при изменении статуса:', error);
        await ctx.answerCbQuery('❌ Ошибка');
    }
  } else if (action.startsWith('view_favorite_')) {
    // Просмотр объявления из избранного
    const adId = action.replace('view_favorite_', '');
    
    try {
        const { data: ad, error } = await supabase
            .from('ads')
            .select(`
                *,
                users!inner(username, first_name, telegram_id)
            `)
            .eq('id', parseInt(adId))
            .eq('status', 'active')
            .single();

        if (error || !ad) {
            await ctx.answerCbQuery('❌ Объявление не найдено');
            return;
        }

        let adText = `📝 ${ad.title}\n\n`;
        adText += `${ad.description}\n\n`;
        adText += `💰 ${ad.price} ₽\n`;
        adText += `👤 @${ad.users.username || 'unknown'} (${ad.users.first_name})\n`;
        adText += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n`;
        
        if (ad.location) {
            adText += `📍 [Показать на карте](https://maps.google.com/?q=${ad.location.latitude},${ad.location.longitude})\n`;
        }

        const buttons = [
            [Markup.button.callback('📞 Написать автору', `contact_author_${ad.id}`)],
            [Markup.button.callback('❤️ Удалить из избранного', `remove_favorite_${ad.id}`)],
            [Markup.button.callback('⬅ Назад', 'favorites')]
        ];

        // Если есть фото, отправляем с фото
        if (ad.photos && ad.photos.length > 0) {
            await ctx.replyWithPhoto(ad.photos[0], {
                caption: adText,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: buttons }
            });
        } else {
            await ctx.reply(adText, Markup.inlineKeyboard(buttons));
        }

        await ctx.answerCbQuery();
    } catch (error) {
        console.error('Ошибка просмотре избранного объявления:', error);
        await ctx.answerCbQuery('❌ Ошибка загрузки объявления');
    }
  } else if (action.startsWith('remove_favorite_')) {
    // Удаление из избранного
    const adId = action.replace('remove_favorite_', '');
    const user = await getOrCreateUser(ctx);
    
    try {
        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('ad_id', parseInt(adId));

        if (error) {
            console.error('Ошибка удаления из избранного:', error);
            await ctx.answerCbQuery('❌ Ошибка удаления');
            return;
        }

        await ctx.answerCbQuery('🗑 Удалено из избранного');
        
        // Перезагружаем список избранного
        ctx.telegram.deleteMessage(ctx.chat.id, ctx.callbackQuery.message.message_id);
        
        const { data: favorites } = await supabase
            .from('favorites')
            .select(`
                *,
                ads!inner(
                    id,
                    title,
                    price,
                    photos,
                    created_at,
                    users!inner(username, first_name)
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (favorites.length === 0) {
            const menu = ctx.from.id === ADMIN_ID ? adminMenu : mainMenu;
            await ctx.reply('❤️ Ваши избранные объявления:\n\n(Пусто)', menu);
        } else {
            let favoriteText = `❤️ Ваши избранные объявления (${favorites.length}):\n\n`;
            
            favorites.forEach((fav, index) => {
                const ad = fav.ads;
                favoriteText += `${index + 1}. 📝 ${ad.title}\n`;
                favoriteText += `💰 ${ad.price} ₽\n`;
                favoriteText += `👤 @${ad.users.username || 'unknown'}\n`;
                favoriteText += `📅 ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n\n`;
            });

            const favoriteButtons = favorites.map((fav, index) => {
                const ad = fav.ads;
                return [
                    Markup.button.callback(`📝 ${ad.title}`, `view_favorite_${ad.id}`),
                    Markup.button.callback('🗑 Удалить', `remove_favorite_${ad.id}`)
                ];
            });

            favoriteButtons.push([Markup.button.callback('⬅ Назад', 'back_to_main')]);

            await ctx.reply(favoriteText, Markup.inlineKeyboard(favoriteButtons));
        }
    } catch (error) {
        console.error('Ошибка при удалении из избранного:', error);
        await ctx.answerCbQuery('❌ Ошибка');
    }
  } else if (action.startsWith('channel_favorite_')) {
    // Добавление в избранное из канала
    const adId = action.replace('channel_favorite_', '');
    const currentUser = await getOrCreateUser(ctx);
    
    try {
        // Проверяем, не добавлено ли уже в избранное
        const { data: existing } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('ad_id', parseInt(adId))
            .single();

        if (existing) {
            await ctx.answerCbQuery('❌ Уже в избранном');
            return;
        }

        // Добавляем в избранное
        const { error } = await supabase
            .from('favorites')
            .insert({
                user_id: currentUser.id,
                ad_id: parseInt(adId)
            });

        if (error) {
            console.error('Ошибка добавления в избранное из канала:', error);
            await ctx.answerCbQuery('❌ Ошибка добавления');
            return;
        }

        await ctx.answerCbQuery('❤️ Добавлено в избранное');
        
        // Отправляем сообщение пользователю в личку
        await ctx.telegram.sendMessage(currentUser.telegram_id, 
            '✅ Объявление добавлено в избранное!\n\n' +
            '📄 Мои избранные объявления:\n' +
            '❤️ Избранное → Мои объявления'
        );
    } catch (error) {
        console.error('Ошибка при добавлении в избранное из канала:', error);
        await ctx.answerCbQuery('❌ Ошибка');
    }
  } else if (action.startsWith('contact_author_')) {
    // Связь с автором объявления
    const adId = action.replace('contact_author_', '');
    
    try {
        // Получаем информацию об объявлении и авторе
        const { data: ad } = await supabase
            .from('ads')
            .select(`
                *,
                users!inner(username, telegram_id)
            `)
            .eq('ads.id', parseInt(adId))
            .single();

        if (!ad) {
            await ctx.answerCbQuery('❌ Объявление не найдено');
            return;
        }

        const author = ad.users;
        
        // Отправляем сообщение с информацией об авторе
        let contactText = `👤 Информация об авторе объявления:\n\n`;
        contactText += `📝 Имя: ${author.first_name}\n`;
        contactText += `🔗 Username: @${author.username || 'не указан'}\n`;
        contactText += `📞 Связаться: [Написать в Telegram](https://t.me/${author.username})\n\n`;
        contactText += `📋 Объявление: ${ad.title}\n`;
        contactText += `💰 Цена: ${ad.price} ₽`;

        await ctx.answerCbQuery('📞 Открыт профиль автора');
        
        // Отправляем сообщение с кнопкой для связи
        await ctx.reply(contactText, Markup.inlineKeyboard([
            [Markup.button.callback('💬 Написать автору', `start_chat_${ad.id}_${author.telegram_id}`)]
        ]));
        
    } catch (error) {
        console.error('Ошибка при получении информации об авторе:', error);
        await ctx.answerCbQuery('❌ Ошибка');
    }
  } else if (action.startsWith('start_chat_')) {
    // Начать чат с автором
    const parts = action.split('_');
    const chatAdId = parts[2];
    const authorTelegramId = parts[3];
    
    try {
        // Получаем информацию об объявлении
        const { data: chatAd } = await supabase
            .from('ads')
            .select('title, description')
            .eq('id', parseInt(chatAdId))
            .single();

        if (!chatAd) {
            await ctx.answerCbQuery('❌ Объявление не найдено');
            return;
        }

        // Создаем чат между пользователями
        const currentUser = await getOrCreateUser(ctx);
        
        const { data: chat } = await supabase
            .from('chats')
            .insert({
                ad_id: parseInt(chatAdId),
                initiator_id: currentUser.id,
                responder_id: authorTelegramId
            })
            .select()
            .single();

        await ctx.answerCbQuery('💬 Чат начат');
        
        // Отправляем первому сообщение
        await ctx.telegram.sendMessage(authorTelegramId,
            `💬 Новый чат по объявлению: "${chatAd.title}"\n\n` +
            `📝 ${chatAd.description}\n\n` +
            `👤 Пользователь @${currentUser.username} хочет связаться с вами\n\n` +
            `💬 Ответьте на это сообщение чтобы начать общение`
        );

        await ctx.reply(
            `💬 Чат с автором объявления начат!\n\n` +
            `📝 Объявление: ${chatAd.title}\n` +
            `👤 Автор: @${authorTelegramId}\n\n` +
            `💬 Вы можете написать сообщение ниже:`
        );
        
    } catch (error) {
        console.error('Ошибка при создании чата:', error);
        await ctx.answerCbQuery('❌ Ошибка создания чата');
    }
  } else if (action.startsWith('favorite_')) {
    // Добавление в избранное
    const favoriteAdId = action.replace('favorite_', '');
    const user = await getOrCreateUser(ctx);
    
    try {
        // Проверяем, не добавлено ли уже в избранное
        const { data: existing } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', user.id)
            .eq('ad_id', parseInt(favoriteAdId))
            .single();

        if (existing) {
            await ctx.answerCbQuery('❌ Уже в избранном');
            return;
        }

        // Добавляем в избранное
        const { error } = await supabase
            .from('favorites')
            .insert({
                user_id: user.id,
                ad_id: parseInt(favoriteAdId)
            });

        if (error) {
            console.error('Ошибка добавления в избранное:', error);
            await ctx.answerCbQuery('❌ Ошибка добавления');
            return;
        }

        await ctx.answerCbQuery('❤️ Добавлено в избранное');
    } catch (error) {
        console.error('Ошибка при добавлении в избранное:', error);
        await ctx.answerCbQuery('❌ Ошибка');
    }
  }
  
  try {
    await ctx.answerCbQuery();
  } catch (e) {
    // Игнорируем ошибку, если callback уже обработан
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
