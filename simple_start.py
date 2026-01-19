#!/usr/bin/env python3
"""
Простой тест запуска Lavka26 Bot
"""

import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes

# Загрузка конфигурации
def load_config():
    config = {}
    try:
        with open('.env', 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#') and line.strip():
                    key, value = line.strip().split('=', 1)
                    config[key] = value
    except FileNotFoundError:
        print("❌ Файл .env не найден!")
        return None
    return config

config = load_config()
if not config:
    exit(1)

TELEGRAM_BOT_TOKEN = config.get('TELEGRAM_BOT_TOKEN', '')

if not TELEGRAM_BOT_TOKEN:
    print("❌ TELEGRAM_BOT_TOKEN не найден в .env")
    exit(1)

print("✅ Конфигурация загружена")
print(f"🤖 Токен бота: {TELEGRAM_BOT_TOKEN[:10]}...")

# Клавиатуры
main_menu = InlineKeyboardMarkup([
    [InlineKeyboardButton("📢 Реклама (50 ₽)", callback_data="promo")],
    [InlineKeyboardButton("📄 Другие категории", callback_data="other")],
])

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /start"""
    await update.message.reply_text(
        "👋 Добро пожаловать в Lavka26 - тестовый режим\n\n"
        "📢 **Рекламные объявления готовы!**\n\n"
        "Выберите опцию:",
        reply_markup=main_menu
    )

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка кнопок"""
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

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка текста"""
    await update.message.reply_text(
        "Пожалуйста, используйте кнопки для навигации.",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🏠 Главное меню", callback_data="back")]
        ])
    )

def main():
    """Запуск бота"""
    print("🚀 Запуск Lavka26 Bot...")
    
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(handle_callback))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    
    print("✅ Обработчики настроены")
    print("🤖 Бот запускается...")
    
    try:
        app.run_polling()
    except Exception as e:
        print(f"❌ Ошибка запуска: {e}")

if __name__ == '__main__':
    main()
