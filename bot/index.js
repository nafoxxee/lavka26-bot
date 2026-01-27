require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

console.log('🚀 Запуск Lavka26 Telegram Bot...');

const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN не найден в .env файле!');
    console.log('Создайте .env файл с TELEGRAM_BOT_TOKEN=ваш_токен');
    process.exit(1);
}

console.log('✅ Токен найден:', token.substring(0, 10) + '...');
console.log('🔗 Backend URL:', backendUrl);
console.log('🔗 Webhook URL:', webhookUrl);

const bot = new TelegramBot(token);
const app = express();

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'lavka26-bot',
        backend_url: backendUrl,
        timestamp: new Date().toISOString() 
    });
});

// Webhook endpoint для Telegram
app.post(`/bot${token}`, (req, res) => {
    console.log('📨 Получен webhook от Telegram');
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Команда /start - главная команда
bot.onText(/\/start/, async (msg) => {
    console.log('🎯 /start от пользователя:', msg.chat.id, msg.from.first_name);
    
    const webAppUrl = `${backendUrl}`;
    
    const keyboard = {
        inline_keyboard: [
            [
                {
                    text: '🛍️ Открыть Lavka26',
                    web_app: { url: webAppUrl }
                }
            ],
            [
                {
                    text: '📱 Мои объявления',
                    callback_data: 'my_ads'
                },
                {
                    text: '❤️ Избранное',
                    callback_data: 'favorites'
                }
            ],
            [
                {
                    text: '📊 Статистика',
                    callback_data: 'stats'
                },
                {
                    text: '⚙️ Настройки',
                    callback_data: 'settings'
                }
            ]
        ]
    };
    
    try {
        await bot.sendMessage(msg.chat.id, 
            `🛍️ *Добро пожаловать в Lavka26!*\n\n` +
            `🔍 Покупайте и продавайте товары прямо в Telegram\n` +
            `📱 Удобный мини-приложение внутри чата\n` +
            `🚀 Быстрые сделки с реальными людьми\n\n` +
            `Нажмите "Открыть Lavka26" чтобы начать!`,
            {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            }
        );
        console.log('✅ Приветственное сообщение отправлено');
    } catch (error) {
        console.error('❌ Ошибка отправки сообщения:', error);
    }
});

// Команда /help
bot.onText(/\/help/, async (msg) => {
    let helpText = `📖 *Справка по Lavka26*\n\n` +
        `🔍 *Основные команды:*\n` +
        `/start - открыть приложение\n` +
        `/help - эта справка\n\n` +
        `🛍️ *Возможности:*\n` +
        `• Создание объявлений\n` +
        `• Поиск товаров\n` +
        `• Избранные объявления\n` +
        `• Связь с продавцами\n` +
        `• Рейтинг пользователей\n\n`;
    
    if (msg.from.id.toString() === '379036860') {
        helpText += `🛡️ *Модераторские команды:*\n` +
            `/mod_pending - Объявления на модерации\n` +
            `/mod_reports - Жалобы\n` +
            `/mod_stats - Статистика\n` +
            `/mod_approve <id> - Одобрить объявление\n` +
            `/mod_reject <id> [причина] - Отклонить объявление\n\n`;
    }
    
    helpText += `❓ *Нужна помощь?* Напишите @lavka26_support`;
    
    try {
        await bot.sendMessage(msg.chat.id, helpText, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('❌ Ошибка отправки help:', error);
    }
});

// Обработка callback кнопок
bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data;
    const chatId = msg.chat.id;
    
    console.log('📱 Callback query:', data, 'от пользователя:', chatId);
    
    try {
        // Подтверждаем получение callback
        await bot.answerCallbackQuery(callbackQuery.id);
        
        switch (data) {
            case 'my_ads':
                const webAppUrl = `${backendUrl}?telegram_id=${callbackQuery.from.id}&first_name=${encodeURIComponent(callbackQuery.from.first_name || '')}&last_name=${encodeURIComponent(callbackQuery.from.last_name || '')}&username=${encodeURIComponent(callbackQuery.from.username || '')}&tab=my_ads`;
                
                await bot.sendMessage(chatId, '📱 *Мои объявления*', {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[{
                            text: '📱 Управление объявлениями',
                            web_app: { url: webAppUrl }
                        }]]
                    }
                });
                break;
                
            case 'favorites':
                const favUrl = `${backendUrl}?telegram_id=${callbackQuery.from.id}&first_name=${encodeURIComponent(callbackQuery.from.first_name || '')}&last_name=${encodeURIComponent(callbackQuery.from.last_name || '')}&username=${encodeURIComponent(callbackQuery.from.username || '')}&tab=favorites`;
                
                await bot.sendMessage(chatId, '❤️ *Избранное*', {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[{
                            text: '❤️ Мои избранные объявления',
                            web_app: { url: favUrl }
                        }]]
                    }
                });
                break;
                
            case 'stats':
                await bot.sendMessage(chatId, 
                    '📊 *Статистика*\n\n' +
                    '🔍 Функция статистики в разработке\n' +
                    'Скоро будет доступна!',
                    { parse_mode: 'Markdown' }
                );
                break;
                
            case 'settings':
                if (callbackQuery.from.id.toString() === '379036860') {
                    // Модераторское меню
                    await bot.sendMessage(chatId, 
                        '🛡️ *Панель модератора*\n\n' +
                        '👤 Вы вошли как модератор\n' +
                        '🆔 ID: ' + callbackQuery.from.id + '\n\n' +
                        '📋 *Доступные команды:*\n' +
                        '/mod_pending - Объявления на модерации\n' +
                        '/mod_reports - Жалобы\n' +
                        '/mod_stats - Статистика\n\n' +
                        '⚡ Управляйте модерацией через команды',
                        { parse_mode: 'Markdown' }
                    );
                } else {
                    await bot.sendMessage(chatId, 
                        '⚙️ *Настройки*\n\n' +
                        '👤 Ваш профиль: ' + (callbackQuery.from.first_name || 'Пользователь') + '\n' +
                        '🆔 ID: ' + callbackQuery.from.id + '\n' +
                        '👋 Username: @' + (callbackQuery.from.username || 'не указан') + '\n\n' +
                        '⚡ Изменить настройки можно в мини-приложении',
                        { parse_mode: 'Markdown' }
                    );
                }
                break;
                
            default:
                await bot.sendMessage(chatId, '❓ Неизвестная команда');
        }
    } catch (error) {
        console.error('❌ Ошибка обработки callback:', error);
    }
});

// Модераторские команды
bot.onText(/\/mod_pending/, async (msg) => {
    if (msg.from.id.toString() !== '379036860') {
        await bot.sendMessage(msg.chat.id, '❌ Доступ запрещен');
        return;
    }
    
    try {
        const response = await fetch(`${backendUrl}/api/moderator/ads?telegram_id=${msg.from.id}`);
        const ads = await response.json();
        
        if (ads.length === 0) {
            await bot.sendMessage(msg.chat.id, '✅ Нет объявлений на модерации');
            return;
        }
        
        let message = '📋 *Объявления на модерации:*\n\n';
        ads.slice(0, 10).forEach(ad => {
            message += `🔸 *ID:* ${ad.id}\n`;
            message += `📝 *Название:* ${ad.title}\n`;
            message += `💰 *Цена:* ${ad.price}₽\n`;
            message += `👤 *Автор:* ${ad.first_name} (@${ad.username || 'no_username'})\n`;
            message += `📅 *Дата:* ${new Date(ad.created_at).toLocaleDateString('ru-RU')}\n\n`;
        });
        
        if (ads.length > 10) {
            message += `📝 Показано 10 из ${ads.length} объявлений`;
        }
        
        await bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Ошибка загрузки объявлений:', error);
        await bot.sendMessage(msg.chat.id, '❌ Ошибка загрузки объявлений');
    }
});

bot.onText(/\/mod_reports/, async (msg) => {
    if (msg.from.id.toString() !== '379036860') {
        await bot.sendMessage(msg.chat.id, '❌ Доступ запрещен');
        return;
    }
    
    try {
        const response = await fetch(`${backendUrl}/api/moderator/reports?telegram_id=${msg.from.id}`);
        const reports = await response.json();
        
        if (reports.length === 0) {
            await bot.sendMessage(msg.chat.id, '✅ Нет жалоб');
            return;
        }
        
        let message = '🚨 *Жалобы:*\n\n';
        reports.slice(0, 10).forEach(report => {
            message += `🔸 *ID жалобы:* ${report.id}\n`;
            message += `📝 *Объявление:* ${report.ad_title}\n`;
            message += `👤 *Жалобщик:* ${report.reporter_name}\n`;
            message += `⚠️ *Причина:* ${report.reason}\n`;
            if (report.description) {
                message += `📄 *Описание:* ${report.description}\n`;
            }
            message += `📅 *Дата:* ${new Date(report.created_at).toLocaleDateString('ru-RU')}\n\n`;
        });
        
        await bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Ошибка загрузки жалоб:', error);
        await bot.sendMessage(msg.chat.id, '❌ Ошибка загрузки жалоб');
    }
});

bot.onText(/\/mod_stats/, async (msg) => {
    if (msg.from.id.toString() !== '379036860') {
        await bot.sendMessage(msg.chat.id, '❌ Доступ запрещен');
        return;
    }
    
    try {
        const response = await fetch(`${backendUrl}/api/moderator/stats?telegram_id=${msg.from.id}`);
        const stats = await response.json();
        
        const message = `📊 *Статистика Lavka26:*\n\n` +
            `📝 *Всего объявлений:* ${stats.total_ads}\n` +
            `⏳ *На модерации:* ${stats.pending_ads}\n` +
            `✅ *Активных:* ${stats.active_ads}\n` +
            `❌ *Отклоненных:* ${stats.rejected_ads}\n\n` +
            `🚨 *Всего жалоб:* ${stats.total_reports}\n` +
            `⏳ *Новых жалоб:* ${stats.pending_reports}\n\n` +
            `👥 *Всего пользователей:* ${stats.total_users}`;
        
        await bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        await bot.sendMessage(msg.chat.id, '❌ Ошибка загрузки статистики');
    }
});

bot.onText(/\/mod_approve (\d+)/, async (msg, match) => {
    if (msg.from.id.toString() !== '379036860') {
        await bot.sendMessage(msg.chat.id, '❌ Доступ запрещен');
        return;
    }
    
    const adId = match[1];
    
    try {
        const response = await fetch(`${backendUrl}/api/moderator/approve-ad/${adId}?telegram_id=${msg.from.id}`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            await bot.sendMessage(msg.chat.id, `✅ Объявление #${adId} одобрено и опубликовано`);
        } else {
            await bot.sendMessage(msg.chat.id, '❌ Ошибка одобрения объявления');
        }
    } catch (error) {
        console.error('Ошибка одобрения:', error);
        await bot.sendMessage(msg.chat.id, '❌ Ошибка одобрения объявления');
    }
});

bot.onText(/\/mod_reject (\d+)(?:\s+(.+))?/, async (msg, match) => {
    if (msg.from.id.toString() !== '379036860') {
        await bot.sendMessage(msg.chat.id, '❌ Доступ запрещен');
        return;
    }
    
    const adId = match[1];
    const reason = match[2] || '';
    
    try {
        const response = await fetch(`${backendUrl}/api/moderator/reject-ad/${adId}?telegram_id=${msg.from.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        });
        
        const result = await response.json();
        
        if (result.success) {
            await bot.sendMessage(msg.chat.id, `❌ Объявление #${adId} отклонено${reason ? `\nПричина: ${reason}` : ''}`);
        } else {
            await bot.sendMessage(msg.chat.id, '❌ Ошибка отклонения объявления');
        }
    } catch (error) {
        console.error('Ошибка отклонения:', error);
        await bot.sendMessage(msg.chat.id, '❌ Ошибка отклонения объявления');
    }
});

// Обработка обычных сообщений
bot.on('message', async (msg) => {
    // Игнорируем команды
    if (msg.text && msg.text.startsWith('/')) return;
    
    console.log('💬 Сообщение от пользователя:', msg.chat.id, msg.text?.substring(0, 50));
    
    // Если это текстовое сообщение, показываем подсказку
    if (msg.text) {
        try {
            await bot.sendMessage(msg.chat.id, 
                '🤖 Используйте команду /start для открытия приложения\n' +
                'Или воспользуйтесь кнопками в главном меню',
                {
                    reply_markup: {
                        inline_keyboard: [[{
                            text: '🛍️ Открыть Lavka26',
                            web_app: { url: `${backendUrl}?telegram_id=${msg.from.id}` }
                        }]]
                    }
                }
            );
        } catch (error) {
            console.error('❌ Ошибка ответа на сообщение:', error);
        }
    }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;

if (webhookUrl) {
    // Режим webhook (для продакшена на Render)
    app.listen(PORT, '0.0.0.0', async () => {
        console.log(`✅ Сервер запущен на порту ${PORT}`);
        console.log(`🔗 Устанавливаем webhook: ${webhookUrl}/bot${token}`);
        
        try {
            await bot.setWebHook(`${webhookUrl}/bot${token}`);
            console.log('✅ Webhook установлен успешно');
        } catch (err) {
            console.error('❌ Ошибка установки webhook:', err);
            console.log('🔄 Переключаемся в режим polling...');
            
            // Если webhook не удался, используем polling
            startPolling();
        }
    });
    
    console.log('🚀 Бот запущен в режиме webhook');
} else {
    // Режим polling (для локальной разработки)
    startPolling();
}

function startPolling() {
    console.log('🔄 Запуск в режиме polling...');
    
    bot.startPolling({
        interval: 1000,
        params: {
            timeout: 10
        }
    });
    
    console.log('📱 Бот запущен в режиме polling');
    console.log('⚡ Нажмите Ctrl+C для остановки');
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Остановка бота...');
    
    if (bot.isPolling()) {
        bot.stopPolling();
        console.log('📊 Polling остановлен');
    }
    
    process.exit(0);
});

console.log('🎉 Lavka26 Bot готов к работе!');
