#!/usr/bin/env python3
"""
Тестовый запуск бота без платежей для проверки функционала
"""

import asyncio
import logging
from datetime import datetime, timedelta
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, BotCommand
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes

from config import TELEGRAM_BOT_TOKEN, FREE_ADS_LIMIT, AD_PRICE, PROMOTION_PRICES, ADMIN_ID, CHANNEL_ID
from supabase_client import db
from keyboards import *
from handlers import setup_handlers

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Состояния пользователя
user_states = {}

class UserState:
    def __init__(self):
        self.step = None
        self.temp_data = {}

async def get_or_create_user(user_data) -> dict:
    """Получить или создать пользователя"""
    user = await db.get_or_create_user(
        telegram_id=user_data.id,
        username=user_data.username,
        first_name=user_data.first_name,
        last_name=user_data.last_name
    )
    return user

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /start"""
    user = update.effective_user
    welcome_text = f"""👋 Добро пожаловать в Lavka26
Торговая площадка объявлений города Михайловска

📢 **НОВИНКА! Рекламные объявления за 50 ₽**

Выберите действие в меню ниже:"""
    
    await update.message.reply_text(welcome_text, reply_markup=main_menu)

async def show_categories(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать категории"""
    await update.message.reply_text(
        "Выберите категорию:",
        reply_markup=categories_keyboard
    )

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка callback кнопок"""
    query = update.callback_query
    await query.answer()
    
    if query.data == "back_to_main":
        await query.message.edit_text(
            "Выберите действие в меню ниже:",
            reply_markup=main_menu
        )
    elif query.data == "category_promo":
        # Показываем информацию о рекламных объявлениях
        await query.message.edit_text(
            "📢 **Рекламные объявления**\n\n"
            "Разместите вашу рекламу для жителей Михайловска!\n\n"
            "💰 **Стоимость: 50 ₽**\n"
            "⏰ **Срок: 30 дней**\n"
            "👁️ **Показы: всем пользователям бота**\n\n"
            "Рекламное объявление будет показано в отдельной категории и выделено специальным значком 📢.\n\n"
            "⚠️ **ВНИМАНИЕ:** Для оплаты рекламных объявлений требуется настройка платежей.\n\n"
            "Свяжитесь с администратором для подключения платежей.",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("ℹ️ Подробнее о рекламе", callback_data="promo_info")],
                [InlineKeyboardButton("⬅ Назад", callback_data="back_to_categories")]
            ])
        )
    elif query.data == "promo_info":
        await query.message.edit_text(
            "📢 **Подробнее о рекламе в Lavka26**\n\n"
            "**Что вы получаете за 50 ₽:**\n"
            "• Размещение в специальной категории \"Реклама\"\n"
            "• Выделение значком 📢 в общем списке\n"
            "• Показ всем пользователям бота\n"
            "• Срок размещения - 30 дней\n\n"
            "**Что можно рекламировать:**\n"
            "• Товары и услуги\n"
            "• Мероприятия и акции\n"
            "• Компании и бренды\n"
            "• Другие объявления\n\n"
            "**Требования:**\n"
            "• Соответствие законодательству РФ\n"
            "• Отсутствие запрещенной тематики\n"
            "• Проверка модератором\n\n"
            "⚠️ **Функция оплаты временно отключена**\n"
            "Для подключения платежей свяжитесь с администратором.",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("⬅ Назад", callback_data="back_to_categories")]
            ])
        )
    elif query.data == "back_to_categories":
        await query.message.edit_text(
            "Выберите категорию:",
            reply_markup=categories_keyboard
        )
    else:
        # Для других категорий показываем заглушку
        await query.message.edit_text(
            "📄 Объявления загружаются...\n\n"
            "⚠️ **Тестовый режим:** Функция просмотра объявлений в разработке\n\n"
            "Доступно:\n"
            "✅ Категория \"Реклама\" - готова к запуску\n"
            "🔧 Остальные категории - в разработке",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("⬅ Назад", callback_data="back_to_categories")]
            ])
        )

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка текстовых сообщений"""
    text = update.message.text
    
    if text == "📄 Смотреть объявления":
        await show_categories(update, context)
    elif text == "➕ Создать объявление":
        await update.message.reply_text(
            "🔧 **В разработке**\n\n"
            "Создание обычных объявлений будет доступно в следующей версии.\n\n"
            "📢 **Рекламные объявления** уже готовы - выберите \"📄 Смотреть объявления\" → \"📢 Реклама (50 ₽)\"",
            reply_markup=main_menu
        )
    elif text == "❤️ Избранное":
        await update.message.reply_text(
            "🔧 **В разработке**\n\n"
            "Функция избранного будет доступна в следующей версии.",
            reply_markup=main_menu
        )
    elif text == "🔍 Поиск":
        await update.message.reply_text(
            "🔧 **В разработке**\n\n"
            "Функция поиска будет доступна в следующей версии.",
            reply_markup=main_menu
        )
    elif text == "⚙ Настройки":
        await update.message.reply_text(
            "🔧 **В разработке**\n\n"
            "Настройки будут доступны в следующей версии.",
            reply_markup=main_menu
        )
    else:
        await update.message.reply_text(
            "Воспользуйтесь меню кнопок для навигации.",
            reply_markup=main_menu
        )

def main():
    """Основная функция"""
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    
    # Команды
    app.add_handler(CommandHandler("start", start_command))
    
    # Сообщения
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    
    # Callback кнопки
    app.add_handler(CallbackQueryHandler(handle_callback))
    
    # Запуск бота
    logger.info("🚀 Запуск тестового бота Lavka26...")
    app.run_polling()

if __name__ == '__main__':
    main()
