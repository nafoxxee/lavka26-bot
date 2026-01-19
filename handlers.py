from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import CallbackQueryHandler, ContextTypes
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, asc
from datetime import datetime

from database import get_session
from models import User, Ad, Category, Favorite, Chat, Message, Payment
from keyboards import *
from payments import handle_payment_request
from config import AD_PRICE, PROMOTION_PRICES

async def handle_ads_list(update: Update, context: ContextTypes.DEFAULT_TYPE, category_id=None, sort_type='new'):
    """Показать список объявлений"""
    query = select(Ad).where(Ad.status == 'active')
    
    if category_id:
        query = query.where(Ad.category_id == category_id)
    
    # Сортировка
    if sort_type == 'new':
        query = query.order_by(desc(Ad.created_at))
    elif sort_type == 'price_asc':
        query = query.order_by(asc(Ad.price))
    elif sort_type == 'price_desc':
        query = query.order_by(desc(Ad.price))
    
    async with get_session() as session:
        result = await session.execute(query.limit(10))
        ads = result.scalars().all()
        
        if not ads:
            await update.callback_query.message.edit_text(
                "📄 Объявления не найдены",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("⬅ Назад", callback_data="back_to_categories")]
                ])
            )
            return
        
        # Показываем первое объявление
        ad = ads[0]
        await show_ad(update, ad, 0, len(ads))

async def handle_promo_category(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка категории Реклама"""
    query = update.callback_query
    await query.answer()
    
    user_id = update.effective_user.id
    
    # Показываем информацию о рекламных объявлениях и предложение оплатить
    await query.message.edit_text(
        "📢 **Рекламные объявления**\n\n"
        "Разместите вашу рекламу для жителей Михайловска!\n\n"
        "💰 **Стоимость: 50 ₽**\n"
        "⏰ **Срок: 30 дней**\n"
        "👁️ **Показы: всем пользователям бота**\n\n"
        "Рекламное объявление будет показано в отдельной категории и выделено специальным значком 📢.\n\n"
        "Готовы разместить рекламу?",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("💳 Оплатить 50 ₽", callback_data="pay_for_promo_ad")],
            [InlineKeyboardButton("ℹ️ Подробнее о рекламе", callback_data="promo_info")],
            [InlineKeyboardButton("⬅ Назад", callback_data="back_to_categories")]
        ])
    )

async def handle_promo_info(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать подробную информацию о рекламе"""
    query = update.callback_query
    await query.answer()
    
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
        "Готовы разместить рекламу?",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("💳 Оплатить 50 ₽", callback_data="pay_for_promo_ad")],
            [InlineKeyboardButton("⬅ Назад", callback_data="back_to_categories")]
        ])
    )

async def show_ad(update: Update, ad: Ad, current_index: int, total_count: int):
    """Показать одно объявление"""
    # Формируем текст объявления
    text = f"📸 {ad.title}\n\n"
    
    if ad.price:
        text += f"💰 {ad.price:.0f} ₽\n\n"
    
    text += f"📝 {ad.description}\n\n"
    text += f"📍 Михайловск\n"
    text += f"👤 Автор объявления\n"
    text += f"📅 {ad.created_at.strftime('%d.%m.%Y')}"
    
    # Создаем клавиатуру
    keyboard = [
        [InlineKeyboardButton("💬 Написать автору", callback_data=f"contact_author_{ad.id}")],
        [InlineKeyboardButton("❤️ В избранное", callback_data=f"add_to_favorites_{ad.id}")],
    ]
    
    # Навигация
    nav_buttons = []
    if current_index > 0:
        nav_buttons.append(InlineKeyboardButton("⬅️ Предыдущее", callback_data=f"nav_ad_{current_index-1}"))
    if current_index < total_count - 1:
        nav_buttons.append(InlineKeyboardButton("Следующее ➡️", callback_data=f"nav_ad_{current_index+1}"))
    
    if nav_buttons:
        keyboard.append(nav_buttons)
    
    keyboard.append([InlineKeyboardButton("⬅ Назад", callback_data="back_to_categories")])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    # Отправляем фото если есть
    if ad.photos and len(ad.photos) > 0:
        await update.callback_query.bot.send_photo(
            chat_id=update.callback_query.message.chat_id,
            photo=ad.photos[0],
            caption=text,
            reply_markup=reply_markup
        )
        await update.callback_query.message.delete()
    else:
        await update.callback_query.message.edit_text(text, reply_markup=reply_markup)

async def handle_add_to_favorites(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Добавить в избранное"""
    query = update.callback_query
    await query.answer()
    
    ad_id = int(query.data.split('_')[-1])
    user_id = update.effective_user.id
    
    async with get_session() as session:
        # Проверяем, есть ли уже в избранном
        existing = await session.execute(
            select(Favorite).where(
                and_(Favorite.user_id == user_id, Favorite.ad_id == ad_id)
            )
        )
        
        if not existing.scalar_one_or_none():
            favorite = Favorite(user_id=user_id, ad_id=ad_id)
            session.add(favorite)
            await session.commit()
            await query.answer("✅ Добавлено в избранное")
        else:
            await query.answer("❌ Уже в избранном")

async def handle_contact_author(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Связаться с автором"""
    query = update.callback_query
    await query.answer()
    
    ad_id = int(query.data.split('_')[-1])
    user_id = update.effective_user.id
    
    async with get_session() as session:
        # Получаем объявление и автора
        ad = await session.get(Ad, ad_id)
        
        if not ad:
            await query.answer("❌ Объявление не найдено")
            return
        
        # Проверяем, не пытается ли пользователь связаться с самим собой
        if ad.user_id == user_id:
            await query.answer("❌ Это ваше объявление")
            return
        
        # Создаем или получаем чат
        existing_chat = await session.execute(
            select(Chat).where(
                and_(
                    Chat.ad_id == ad_id,
                    or_(
                        and_(Chat.initiator_id == user_id, Chat.responder_id == ad.user_id),
                        and_(Chat.initiator_id == ad.user_id, Chat.responder_id == user_id)
                    )
                )
            )
        )
        
        chat = existing_chat.scalar_one_or_none()
        
        if not chat:
            chat = Chat(
                ad_id=ad_id,
                initiator_id=user_id,
                responder_id=ad.user_id
            )
            session.add(chat)
            await session.commit()
            await session.refresh(chat)
        
        await query.message.edit_text(
            f"💬 Чат по объявлению:\n「{ad.title}」\n\n"
            "Напишите ваше сообщение:",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("📎 Отправить фото", callback_data=f"send_photo_{chat.id}")],
                [InlineKeyboardButton("🚫 Пожаловаться", callback_data=f"report_{chat.id}")],
                [InlineKeyboardButton("❌ Закрыть чат", callback_data="close_chat")]
            ])
        )

async def handle_my_ads(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Мои объявления"""
    query = update.callback_query
    await query.answer()
    
    user_id = update.effective_user.id
    status = query.data.split('_')[-1] if '_' in query.data else 'active'
    
    async with get_session() as session:
        ads_query = select(Ad).where(
            and_(Ad.user_id == user_id, Ad.status == status)
        ).order_by(desc(Ad.created_at))
        
        result = await session.execute(ads_query)
        ads = result.scalars().all()
        
        if not ads:
            text = f"📄 У вас нет {'активных' if status == 'active' else 'объявлений в модерации' if status == 'moderation' else 'архивных'} объявлений"
        else:
            text = f"📄 Ваши {'активные' if status == 'active' else 'объявления в модерации' if status == 'moderation' else 'архивные'} объявления:\n\n"
            for i, ad in enumerate(ads[:5], 1):
                text += f"{i}. {ad.title}\n"
                if ad.price:
                    text += f"   💰 {ad.price:.0f} ₽\n"
                text += f"   📅 {ad.created_at.strftime('%d.%m.%Y')}\n\n"
        
        keyboard = [
            [InlineKeyboardButton("✏ Редактировать", callback_data=f"edit_ad_{ads[0].id if ads else 0}")],
            [InlineKeyboardButton("🚀 Продвинуть", callback_data=f"promote_my_ad_{ads[0].id if ads else 0}")],
            [InlineKeyboardButton("❌ Удалить", callback_data=f"delete_ad_{ads[0].id if ads else 0}")],
            [InlineKeyboardButton("⬅ Назад", callback_data="back_to_settings")]
        ] if ads else [[InlineKeyboardButton("⬅ Назад", callback_data="back_to_settings")]]
        
        await query.message.edit_text(text, reply_markup=InlineKeyboardMarkup(keyboard))

async def handle_search_input(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка поискового запроса"""
    if not update.message or not update.message.text:
        return
    
    search_text = update.message.text.lower()
    
    async with get_session() as session:
        query = select(Ad).where(
            and_(
                Ad.status == 'active',
                or_(
                    Ad.title.ilike(f'%{search_text}%'),
                    Ad.description.ilike(f'%{search_text}%')
                )
            )
        ).order_by(desc(Ad.created_at)).limit(10)
        
        result = await session.execute(query)
        ads = result.scalars().all()
        
        if not ads:
            await update.message.reply_text(
                "🔍 По вашему запросу ничего не найдено\n\n"
                "Попробуйте изменить запрос или использовать фильтры:",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("📂 Категория", callback_data="filter_category")],
                    [InlineKeyboardButton("💰 Цена от / до", callback_data="filter_price")],
                    [InlineKeyboardButton("📍 Расстояние", callback_data="filter_distance")],
                    [InlineKeyboardButton("⬅ Назад", callback_data="back_to_main")]
                ])
            )
        else:
            text = f"🔍 Найдено объявлений: {len(ads)}\n\n"
            for i, ad in enumerate(ads[:5], 1):
                text += f"{i}. {ad.title}\n"
                if ad.price:
                    text += f"   💰 {ad.price:.0f} ₽\n"
                text += f"   📝 {ad.description[:100]}...\n\n"
            
            await update.message.reply_text(
                text,
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("📂 Фильтры", callback_data="filter_category")],
                    [InlineKeyboardButton("⬅ Назад", callback_data="back_to_main")]
                ])
            )

async def handle_navigation(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Навигация между объявлениями"""
    query = update.callback_query
    await query.answer()
    
    ad_index = int(query.data.split('_')[-1])
    
    # Здесь нужно получить список объявлений и показать нужное
    # Упрощенная версия
    await query.answer("Переключение объявления")

async def handle_promotion(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка запросов на продвижение объявлений"""
    query = update.callback_query
    await query.answer()
    
    user_id = update.effective_user.id
    data = query.data
    
    if data == "promote_boost":
        # Показываем варианты поднятия
        await query.message.edit_text(
            "🚀 Выберите период поднятия объявления:",
            reply_markup=boost_options
        )
    elif data == "promote_pin":
        # Показываем вариант закрепления
        await query.message.edit_text(
            "📌 Закрепление объявления:",
            reply_markup=pin_option
        )
    elif data.startswith("boost_"):
        # Обработка выбора поднятия
        await handle_payment_request_wrapper(update, context, data)
    elif data == "pin_month":
        # Обработка выбора закрепления
        await handle_payment_request_wrapper(update, context, data)
    elif data.startswith("promote_my_ad"):
        # Продвижение конкретного объявления
        ad_id = int(data.split('_')[-1]) if '_' in data else 0
        await query.message.edit_text(
            "🚀 Выберите способ продвижения:",
            reply_markup=promotion_keyboard
        )

async def handle_payment_request_wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE, payment_type: str):
    """Обработка запроса на оплату (обертка для payments.py)"""
    # Вызываем оригинальный обработчик из payments.py
    await handle_payment_request(update, context)

# Регистрация обработчиков
def setup_handlers(application):
    """Настроить обработчики"""
    application.add_handler(CallbackQueryHandler(handle_ads_list, pattern="^(category_|sort_)"))
    application.add_handler(CallbackQueryHandler(handle_add_to_favorites, pattern="^add_to_favorites_"))
    application.add_handler(CallbackQueryHandler(handle_contact_author, pattern="^contact_author_"))
    application.add_handler(CallbackQueryHandler(handle_my_ads, pattern="^my_ads_"))
    application.add_handler(CallbackQueryHandler(handle_navigation, pattern="^nav_ad_"))
    application.add_handler(CallbackQueryHandler(handle_promotion, pattern="^(promote_|boost_|pin_month)"))
    application.add_handler(CallbackQueryHandler(handle_search_input, pattern="^search_input"))
    application.add_handler(CallbackQueryHandler(handle_promo_category, pattern="^category_promo$"))
    application.add_handler(CallbackQueryHandler(handle_promo_info, pattern="^promo_info$"))
    application.add_handler(CallbackQueryHandler(handle_navigation, pattern="^nav_ad_"))
