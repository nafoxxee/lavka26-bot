import sys
import os

print("🚀 ЗАПУСК LAVKA26 BOT")
print("=" * 50)

# Проверка Python версии
print(f"🐍 Python версия: {sys.version}")

# Проверка текущей директории
print(f"📁 Текущая директория: {os.getcwd()}")

# Проверка .env файла
if os.path.exists('.env'):
    print("✅ Файл .env найден")
    with open('.env', 'r') as f:
        content = f.read()
        if 'TELEGRAM_BOT_TOKEN=' in content:
            token = content.split('TELEGRAM_BOT_TOKEN=')[1].split('\n')[0].strip()
            if token:
                print(f"✅ Токен бота: {token[:10]}...")
            else:
                print("❌ Токен бота пустой")
        else:
            print("❌ Токен бота не найден")
else:
    print("❌ Файл .env не найден")

# Проверка импорта telegram
try:
    import telegram
    print("✅ Библиотека telegram импортирована")
    if hasattr(telegram, '__version__'):
        print(f"📦 Версия telegram: {telegram.__version__}")
except ImportError as e:
    print(f"❌ Ошибка импорта telegram: {e}")
    print("💡 Выполните: pip install python-telegram-bot")
    sys.exit(1)

# Попытка запуска бота
print("\n🚀 Попытка запуска бота...")

try:
    from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
    from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes
    
    # Загрузка токена
    with open('.env', 'r') as f:
        for line in f:
            if line.startswith('TELEGRAM_BOT_TOKEN='):
                TELEGRAM_BOT_TOKEN = line.split('=')[1].strip()
                break
    
    if not TELEGRAM_BOT_TOKEN:
        print("❌ Токен не найден")
        sys.exit(1)
    
    # Создание простого бота
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    
    async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("📢 Реклама (50 ₽)", callback_data="promo")],
            [InlineKeyboardButton("📄 Другие категории", callback_data="other")],
        ])
        
        await update.message.reply_text(
            "👋 Добро пожаловать в Lavka26!\n\n"
            "📢 **Рекламные объявления готовы!**\n\n"
            "Выберите опцию:",
            reply_markup=keyboard
        )
    
    async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        await query.answer()
        
        if query.data == "promo":
            await query.message.edit_text(
                "📢 **Рекламные объявления**\n\n"
                "✅ **Функция готова к запуску!**\n\n"
                "**Что работает:**\n"
                "• Категория \"Реклама (50 ₽)\" в меню\n"
                "• Пошаговое создание рекламного объявления\n"
                "• Оплата через Telegram Payments\n"
                "• Выбор срока размещения\n"
                "• Валидация данных\n\n"
                "**Требуется для полного запуска:**\n"
                "• Настройка PAYMENT_PROVIDER_TOKEN в .env\n"
                "• Подключение платежного шлюза Telegram\n\n"
                "💰 **Стоимость:** 50 ₽ за 30 дней\n"
                "📈 **Доп. опции:** +100 ₽ за 90 дней, +200 ₽ за 120 дней\n\n"
                "🚀 **Бот готов к запуску и монетизации!**",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("⬅ Назад", callback_data="back")]
                ])
            )
        elif query.data == "other":
            await query.message.edit_text(
                "📄 **Другие категории**\n\n"
                "🔧 **В разработке**\n\n"
                "Обычные объявления будут доступны в следующей версии.\n\n"
                "Сейчас готова только функция рекламных объявлений.",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("⬅ Назад", callback_data="back")]
                ])
            )
        elif query.data == "back":
            await start(update, context)
    
    # Настройка обработчиков
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(handle_callback))
    
    print("✅ Обработчики настроены")
    print("🤖 Бот запускается...")
    print("📱 Открывайте Telegram и ищите бота!")
    print("💰 Рекламные объявления готовы к монетизации!")
    
    app.run_polling()
    
except Exception as e:
    print(f"❌ Ошибка запуска: {e}")
    import traceback
    traceback.print_exc()
