#!/usr/bin/env python3
"""
Минимальный тест бота для проверки рекламы
"""

import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes

from config import TELEGRAM_BOT_TOKEN

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /start"""
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("📢 Реклама (50 ₽)", callback_data="promo")],
        [InlineKeyboardButton("📄 Другие категории", callback_data="other")],
    ])
    
    await update.message.reply_text(
        "👋 Добро пожаловать в Lavka26 - тестовый режим\n\n"
        "📢 **Рекламные объявления готовы!**\n\n"
        "Выберите опцию:",
        reply_markup=keyboard
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
            "Готовы к запуску! 🚀",
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
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(handle_callback))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    
    logger.info("🚀 Запуск минимального теста бота...")
    app.run_polling()

if __name__ == '__main__':
    main()
