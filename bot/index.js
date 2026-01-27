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
    
    const webAppUrl = `${backendUrl}?telegram_id=${msg.from.id}&first_name=${encodeURIComponent(msg.from.first_name || '')}&last_name=${encodeURIComponent(msg.from.last_name || '')}&username=${encodeURIComponent(msg.from.username || '')}`;
    
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
    const helpText = `📖 *Справка по Lavka26*\n\n` +
        `🔍 *Основные команды:*\n` +
        `/start - открыть приложение\n` +
        `/help - эта справка\n\n` +
        `🛍️ *Возможности:*\n` +
        `• Создание объявлений\n` +
        `• Поиск товаров\n` +
        `• Избранные объявления\n` +
        `• Связь с продавцами\n` +
        `• Рейтинг пользователей\n\n` +
        `❓ *Нужна помощь?* Напишите @lavka26_support`;
    
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
                await bot.sendMessage(chatId, 
                    '⚙️ *Настройки*\n\n' +
                    '👤 Ваш профиль: ' + (callbackQuery.from.first_name || 'Пользователь') + '\n' +
                    '🆔 ID: ' + callbackQuery.from.id + '\n' +
                    '👋 Username: @' + (callbackQuery.from.username || 'не указан') + '\n\n' +
                    '⚡ Изменить настройки можно в мини-приложении',
                    { parse_mode: 'Markdown' }
                );
                break;
                
            default:
                await bot.sendMessage(chatId, '❓ Неизвестная команда');
        }
    } catch (error) {
        console.error('❌ Ошибка обработки callback:', error);
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
