from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, LabeledPrice
from telegram.ext import CallbackQueryHandler, ContextTypes, PreCheckoutQueryHandler, MessageHandler, filters
from datetime import datetime, timedelta

from supabase_client import db
from config import AD_PRICE, PROMOTION_PRICES, PAYMENT_PROVIDER_TOKEN, PROMO_AD_PRICE

async def handle_payment_request(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка запроса на оплату"""
    query = update.callback_query
    await query.answer()
    
    user_id = update.effective_user.id
    payment_type = query.data
    
    if payment_type == "pay_for_ad":
        # Оплата дополнительного объявления
        title = "Дополнительное объявление"
        description = "Публикация объявления сверх бесплатного лимита"
        payload = f"ad_creation_{user_id}_{datetime.now().timestamp()}"
        amount = AD_PRICE * 100  # в копейках
        
    elif payment_type == "pay_for_promo_ad":
        # Оплата рекламного объявления
        title = "Рекламное объявление"
        description = "Публикация рекламного объявления в категории Реклама"
        payload = f"promo_ad_{user_id}_{datetime.now().timestamp()}"
        amount = PROMO_AD_PRICE * 100  # в копейках
        
    elif payment_type == "pay_for_promo_ad_extended":
        # Оплата продленного рекламного объявления
        title = "Рекламное объявление (продленный срок)"
        description = "Публикация рекламного объявления на продленный срок"
        payload = f"promo_ad_extended_{user_id}_{datetime.now().timestamp()}"
        amount = (PROMO_AD_PRICE + 100) * 100  # базовая цена + доп плата
        
    elif payment_type.startswith("boost_"):
        # Оплата продвижения
        boost_type = payment_type.replace("boost_", "")
        if boost_type == "day":
            title = "Поднятие объявления на сутки"
            description = "Ваше объявление будет в топе 24 часа"
            amount = PROMOTION_PRICES['boost_day'] * 100
        elif boost_type == "week":
            title = "Поднятие объявления на неделю"
            description = "Ваше объявление будет в топе 7 дней"
            amount = PROMOTION_PRICES['boost_week'] * 100
        else:
            return
        
        payload = f"boost_{boost_type}_{user_id}_{datetime.now().timestamp()}"
        
    elif payment_type == "pin_month":
        # Оплата закрепления
        title = "Закрепление объявления на месяц"
        description = "Ваше объявление будет закреплено в топе 30 дней"
        payload = f"pin_month_{user_id}_{datetime.now().timestamp()}"
        amount = PROMOTION_PRICES['pin_month'] * 100
        
    else:
        return
    
    # Создаем инвойс
    await query.bot.send_invoice(
        chat_id=query.message.chat_id,
        title=title,
        description=description,
        payload=payload,
        provider_token=PAYMENT_PROVIDER_TOKEN,
        currency="RUB",
        prices=[LabeledPrice(label=title, amount=amount)],
        need_name=True,
        need_phone_number=True,
        need_email=True,
        is_flexible=False
    )

async def pre_checkout(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Предпроверка оплаты"""
    query = update.pre_checkout_query
    
    # Проверяем, что пользователь существует
    user = await db.get_user(query.from_user.id)
    
    if not user:
        await query.answer(ok=False, error_message="Пользователь не найден")
        return
    
    # Сохраняем информацию о платеже
    payment_data = {
        'user_id': user['id'],
        'amount': query.total_amount / 100,  # конвертируем из копеек
        'type': query.invoice_payload.split('_')[0],
        'status': 'pending',
        'telegram_payment_id': query.id,
        'created_at': datetime.now().isoformat()
    }
    
    await db.create_payment(payment_data)
    await query.answer(ok=True)

async def successful_payment(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Успешная оплата"""
    message = update.message
    payment = message.successful_payment
    
    # Обновляем статус платежа в БД
    db_payment = await db.get_payment_by_telegram_id(payment.telegram_payment_charge_id)
    
    if db_payment:
        await db.update_payment_status(db_payment['id'], 'completed')
        
        # Выполняем действие в зависимости от типа платежа
        payment_type = db_payment['type']
        
        if payment_type == 'ad_creation':
            await message.reply_text(
                "✅ Оплата прошла успешно!\n\n"
                "Теперь вы можете создать дополнительное объявление.",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("➕ Создать объявление", callback_data="create_ad")],
                    [InlineKeyboardButton("🏠 Главное меню", callback_data="back_to_main")]
                ])
            )
            
        elif payment_type == 'promo_ad':
            await message.reply_text(
                "✅ Оплата рекламного объявления прошла успешно!\n\n"
                "Теперь вы можете создать рекламное объявление.",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("📢 Создать рекламное объявление", callback_data="create_promo_ad")],
                    [InlineKeyboardButton("🏠 Главное меню", callback_data="back_to_main")]
                ])
            )
            
        elif payment_type == 'promo_ad_extended':
            await message.reply_text(
                "✅ Оплата продленного рекламного объявления прошла успешно!\n\n"
                "Теперь вы можете создать рекламное объявление с продленным сроком.",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("📢 Создать рекламное объявление", callback_data="create_promo_ad")],
                    [InlineKeyboardButton("🏠 Главное меню", callback_data="back_to_main")]
                ])
            )
            
        elif payment_type.startswith('boost'):
            # Логика поднятия объявления
            await message.reply_text(
                "✅ Объявление успешно поднято!\n\n"
                "Оно будет в топе указанный период.",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("🏠 Главное меню", callback_data="back_to_main")]
                ])
            )
            
        elif payment_type == 'pin_month':
            # Логика закрепления объявления
            await message.reply_text(
                "✅ Объявление успешно закреплено!\n\n"
                "Оно будет в топе 30 дней.",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("🏠 Главное меню", callback_data="back_to_main")]
                ])
            )

async def check_payment_limit(user_id: int) -> tuple[bool, int]:
    """Проверить лимит бесплатных объявлений"""
    user = await db.get_user(user_id)
    
    if not user:
        return False, 0
    
    # Считаем активные объявления
    active_ads = await db.get_user_active_ads_count(user['id'])
    
    # Проверяем, есть ли оплаченные объявления
    paid_ads = await db.get_user_completed_payments_count(user['id'], 'ad_creation')
    
    total_allowed = 5 + paid_ads
    has_limit = active_ads >= total_allowed
    
    return has_limit, total_allowed - active_ads

async def show_payment_history(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """История платежей"""
    query = update.callback_query
    await query.answer()
    
    user_id = update.effective_user.id
    
    user = await db.get_user(user_id)
    
    if not user:
        await query.message.edit_text("❌ Пользователь не найден")
        return
    
    payments = await db.get_user_payments(user['id'], limit=10)
    
    if not payments:
        text = "💳 У вас пока нет платежей"
    else:
        text = "💳 История платежей:\n\n"
        for payment in payments:
            status_emoji = "✅" if payment['status'] == 'completed' else "⏳" if payment['status'] == 'pending' else "❌"
            type_name = {
                'ad_creation': 'Создание объявления',
                'boost_day': 'Поднятие (сутки)',
                'boost_week': 'Поднятие (неделя)',
                'pin_month': 'Закрепление (месяц)'
            }.get(payment['type'], payment['type'])
            
            text += f"{status_emoji} {type_name} - {payment['amount']:.0f} ₽\n"
            text += f"   📅 {payment['created_at'][:10]} {payment['created_at'][11:16]}\n\n"
    
    await query.message.edit_text(
        text,
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("⬅ Назад", callback_data="back_to_settings")]
        ])
    )

# Регистрация обработчиков платежей
def setup_payment_handlers(application):
    """Настроить обработчики платежей"""
    application.add_handler(CallbackQueryHandler(handle_payment_request, pattern="^(pay_for_ad|pay_for_promo_ad|pay_for_promo_ad_extended|boost_|pin_month)$"))
    application.add_handler(PreCheckoutQueryHandler(pre_checkout))
    application.add_handler(MessageHandler(filters.SUCCESSFUL_PAYMENT, successful_payment))
    application.add_handler(CallbackQueryHandler(show_payment_history, pattern="^payment_history$"))
