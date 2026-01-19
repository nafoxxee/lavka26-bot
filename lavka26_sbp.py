#!/usr/bin/env python3
"""
Lavka26 Bot - ПРОСТАЯ ВЕРСИЯ С РУЧНОЙ ОПЛАТОЙ СБП
Идеально для старта без комиссий и сложных интеграций
"""

import os
import logging
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, BotCommand
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
ADMIN_ID = int(config.get('ADMIN_ID', 0))

if not TELEGRAM_BOT_TOKEN:
    print("❌ TELEGRAM_BOT_TOKEN не найден в .env")
    exit(1)

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Состояния пользователей
user_payments = {}  # {user_id: {'status': 'pending', 'amount': 199, 'timestamp': ...}}

# Цены
PROMO_AD_PRICE = 199  # Простая цена для старта

# Клавиатуры
main_menu = InlineKeyboardMarkup([
    [InlineKeyboardButton("📢 Рекламное объявление (199 ₽)", callback_data="promo_ad")],
    [InlineKeyboardButton("📄 Другие категории", callback_data="other")],
    [InlineKeyboardButton("ℹ️ Как это работает", callback_data="how_it_works")],
])

payment_keyboard = InlineKeyboardMarkup([
    [InlineKeyboardButton("💳 Оплатить 199 ₽", callback_data="pay_promo")],
    [InlineKeyboardButton("✅ Я оплатил", callback_data="i_paid")],
    [InlineKeyboardButton("❌ Отмена", callback_data="cancel_payment")],
])

admin_confirm_keyboard = InlineKeyboardMarkup([
    [InlineKeyboardButton("✅ Подтвердить оплату", callback_data="confirm_payment")],
    [InlineKeyboardButton("❌ Отклонить", callback_data="reject_payment")],
])

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /start"""
    user = update.effective_user
    
    await update.message.reply_text(
        f"👋 Добро пожаловать в Lavka26, {user.first_name}!\n\n"
        "📢 **Рекламные объявления для жителей Михайловска**\n\n"
        "💰 **Стоимость: 199 ₽**\n"
        "⏰ **Срок: 30 дней**\n"
        "👁️ **Показы: всем пользователям бота**\n\n"
        "Простая оплата через СБП без комиссий!\n\n"
        "Выберите действие:",
        reply_markup=main_menu
    )

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка callback кнопок"""
    query = update.callback_query
    await query.answer()
    user_id = update.effective_user.id
    
    if query.data == "promo_ad":
        await show_promo_info(update, context)
    
    elif query.data == "how_it_works":
        await show_how_it_works(update, context)
    
    elif query.data == "pay_promo":
        await show_payment_details(update, context)
    
    elif query.data == "i_paid":
        await handle_user_paid(update, context)
    
    elif query.data == "cancel_payment":
        await cancel_payment(update, context)
    
    elif query.data == "confirm_payment":
        await confirm_payment(update, context)
    
    elif query.data == "reject_payment":
        await reject_payment(update, context)
    
    elif query.data == "other":
        await query.message.edit_text(
            "📄 **Другие категории**\n\n"
            "🔧 **В разработке**\n\n"
            "Обычные объявления будут доступны в следующей версии.\n\n"
            "Сейчас готова только функция рекламных объявлений с простой оплатой.",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("⬅ Назад", callback_data="back_to_main")]
            ])
        )
    
    elif query.data == "back_to_main":
        await query.message.edit_text(
            "Выберите действие:",
            reply_markup=main_menu
        )

async def show_promo_info(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать информацию о рекламе"""
    query = update.callback_query
    
    await query.message.edit_text(
        "📢 **Рекламные объявления в Lavka26**\n\n"
        "**Что вы получаете за 199 ₽:**\n"
        "• Размещение в специальной категории \"Реклама\"\n"
        "• Выделение значком 📢 в общем списке\n"
        "• Показ всем пользователям бота\n"
        "• Срок размещения - 30 дней\n"
        "• Модерация и поддержка\n\n"
        "**Что можно рекламировать:**\n"
        "• Товары и услуги\n"
        "• Мероприятия и акции\n"
        "• Компании и бренды\n"
        "• Другие объявления\n\n"
        "**Преимущества:**\n"
        "• Целевая аудитория - жители Михайловска\n"
        "• Низкая стоимость по сравнению с конкурентами\n"
        "• Простая оплата через СБП\n"
        "• Быстрая публикация после подтверждения\n\n"
        "Готовы разместить рекламу?",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("💳 Оплатить 199 ₽", callback_data="pay_promo")],
            [InlineKeyboardButton("⬅ Назад", callback_data="back_to_main")]
        ])
    )

async def show_how_it_works(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать как работает оплата"""
    query = update.callback_query
    
    await query.message.edit_text(
        "ℹ️ **Как работает оплата**\n\n"
        "🔁 **Простая схема оплаты:**\n\n"
        "1. Нажимаете **«Оплатить 199 ₽»**\n"
        "2. Бот показывает реквизиты для СБП\n"
        "3. Переводите 199 ₽ через СБП\n"
        "4. Обязательно пишете комментарий: `Lavka26_{ваш_id}`\n"
        "5. Нажимаете **«Я оплатил»**\n"
        "6. Отправляете скриншот чека\n"
        "7. Администратор проверяет и подтверждает\n"
        "8. Ваша реклама публикуется!\n\n"
        "⚠️ **Важно:** Без комментария оплата не засчитывается\n\n"
        "💰 **Преимущества:**\n"
        "• Нет комиссий\n"
        "• Надежно и безопасно\n"
        "• Быстрая проверка админом\n"
        "• Мгновенная публикация",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("💳 Оплатить 199 ₽", callback_data="pay_promo")],
            [InlineKeyboardButton("⬅ Назад", callback_data="back_to_main")]
        ])
    )

async def show_payment_details(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать детали оплаты"""
    query = update.callback_query
    user_id = update.effective_user.id
    
    # Сохраняем информацию о платеже
    user_payments[user_id] = {
        'status': 'pending',
        'amount': PROMO_AD_PRICE,
        'timestamp': datetime.now(),
        'username': update.effective_user.username,
        'first_name': update.effective_user.first_name
    }
    
    await query.message.edit_text(
        f"💳 **Оплата через СБП**\n\n"
        f"💰 **Сумма: {PROMO_AD_PRICE} ₽**\n\n"
        f"📱 **Реквизиты для оплаты:**\n"
        f"**Банк:** Тинькофф\n"
        f"**Номер:** `+7 (999) 123-45-67`\n"
        f"**Получатель:** Lavka26\n\n"
        f"📝 **Комментарий к переводу (ОБЯЗАТЕЛЬНО):**\n"
        f"`Lavka26_{user_id}`\n\n"
        f"⚠️ **Без комментария оплата не засчитается!**\n\n"
        f"📸 **После оплаты:**\n"
        f"1. Нажмите кнопку **«Я оплатил»**\n"
        f"2. Отправьте скриншот чека\n"
        f"3. Ждите подтверждения администратора\n\n"
        f"🕐 **Проверка обычно занимает 5-15 минут**",
        reply_markup=payment_keyboard
    )

async def handle_user_paid(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка 'Я оплатил'"""
    query = update.callback_query
    user_id = update.effective_user.id
    
    if user_id not in user_payments:
        await query.message.edit_text(
            "❌ Сначала начните оплату\n\n"
            "Нажмите «💳 Оплатить 199 ₽»",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("💳 Оплатить 199 ₽", callback_data="pay_promo")]
            ])
        )
        return
    
    await query.message.edit_text(
        "✅ **Отлично! Теперь отправьте скриншот чека**\n\n"
        "📸 Сделайте скриншот:\n"
        "• Экран с переводом\n"
        "• Видна сумма 199 ₽\n"
        "• Виден комментарий Lavka26_{ваш_id}\n\n"
        "👇 Отправьте фото чека в этот чат",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("❌ Отменить", callback_data="cancel_payment")]
        ])
    )

async def cancel_payment(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Отмена оплаты"""
    query = update.callback_query
    user_id = update.effective_user.id
    
    if user_id in user_payments:
        del user_payments[user_id]
    
    await query.message.edit_text(
        "❌ Оплата отменена\n\n"
        "Вы можете вернуться и начать заново",
        reply_markup=main_menu
    )

async def confirm_payment(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Подтверждение оплаты админом"""
    query = update.callback_query
    
    if query.from_user.id != ADMIN_ID:
        await query.answer("Только администратор может подтвердить оплату", show_alert=True)
        return
    
    # Извлекаем ID пользователя из callback_data (должен быть передан)
    await query.answer("✅ Оплата подтверждена!")
    
    await query.message.edit_text(
        "✅ **Оплата подтверждена администратором**\n\n"
        "📢 Рекламное объявление будет опубликовано в течение 5 минут\n\n"
        "Спасибо за выбор Lavka26! 🎉",
        reply_markup=main_menu
    )

async def reject_payment(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Отклонение оплаты админом"""
    query = update.callback_query
    
    if query.from_user.id != ADMIN_ID:
        await query.answer("Только администратор может отклонить оплату", show_alert=True)
        return
    
    await query.answer("❌ Оплата отклонена")
    
    await query.message.edit_text(
        "❌ **Оплата не подтверждена**\n\n"
        "Пожалуйста, проверьте:\n"
        "• Правильность суммы (199 ₽)\n"
        "• Наличие комментария Lavka26_{ваш_id}\n"
        "• Четкость скриншота\n\n"
        "Попробуйте оплатить заново",
        reply_markup=main_menu
    )

async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка фото чеков"""
    user_id = update.effective_user.id
    
    # Проверяем, есть ли ожидающий платеж
    if user_id not in user_payments or user_payments[user_id]['status'] != 'pending':
        await update.message.reply_text(
            "❌ Нет ожидающих платежей\n\n"
            "Сначала начните оплату",
            reply_markup=main_menu
        )
        return
    
    payment_info = user_payments[user_id]
    
    # Отправляем админу информацию о платеже
    if ADMIN_ID:
        await context.bot.send_message(
            ADMIN_ID,
            f"💰 **Новый платеж на проверку**\n\n"
            f"👤 **Пользователь:** {payment_info['first_name']} (@{payment_info['username'] or 'нет'})\n"
            f"🆔 **ID:** {user_id}\n"
            f"💰 **Сумма:** {payment_info['amount']} ₽\n"
            f"⏰ **Время:** {payment_info['timestamp'].strftime('%H:%M:%S')}\n\n"
            f"📸 **Чек ниже:**",
            reply_markup=admin_confirm_keyboard
        )
        
        # Пересылаем фото чека админу
        await context.bot.forward_message(
            ADMIN_ID,
            update.message.chat_id,
            update.message.message_id
        )
    
    await update.message.reply_text(
        "✅ **Чек отправлен администратору**\n\n"
        "🕐 **Ожидайте подтверждения** (обычно 5-15 минут)\n\n"
        "💡 **Статус проверки придет в этот чат**",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🏠 Главное меню", callback_data="back_to_main")]
        ])
    )

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка текстовых сообщений"""
    await update.message.reply_text(
        "Пожалуйста, используйте кнопки для навигации",
        reply_markup=main_menu
    )

def main():
    """Основная функция"""
    logger.info("🚀 Запуск Lavka26 Bot с ручной оплатой СБП")
    logger.info(f"💰 Стоимость рекламы: {PROMO_AD_PRICE} ₽")
    logger.info(f"👑 Администратор: {ADMIN_ID}")
    
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    
    # Команды
    app.add_handler(CommandHandler("start", start))
    
    # Сообщения
    app.add_handler(MessageHandler(filters.PHOTO, handle_photo))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    
    # Callback кнопки
    app.add_handler(CallbackQueryHandler(handle_callback))
    
    # Установка команд
    app.bot.set_my_commands([
        BotCommand("start", "🚀 Запустить бота"),
    ])
    
    logger.info("✅ Бот готов к работе!")
    logger.info("📢 Рекламные объявления с ручной оплатой СБП готовы!")
    
    app.run_polling()

if __name__ == '__main__':
    main()
