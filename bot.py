import asyncio
import logging
from datetime import datetime, timedelta
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, BotCommand, LabeledPrice
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes

from config import TELEGRAM_BOT_TOKEN, FREE_ADS_LIMIT, AD_PRICE, PROMOTION_PRICES, ADMIN_ID, CHANNEL_ID, PAYMENT_PROVIDER_TOKEN
from supabase_client import db
from keyboards import *
from handlers import setup_handlers
from payments import setup_payment_handlers

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Состояния пользователя
user_states = {}

class UserState:
    def __init__(self):
        self.step = None
        self.temp_data = {}

async def init_categories():
    """Инициализация категорий"""
    success = await db.init_categories()
    if success:
        logger.info("✅ Категории успешно инициализированы")
    else:
        logger.error("❌ Ошибка инициализации категорий")

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

Выберите действие в меню ниже:"""
    
    await update.message.reply_text(welcome_text, reply_markup=main_menu)

async def show_categories(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать категории"""
    await update.message.reply_text(
        "Выберите категорию:",
        reply_markup=categories_keyboard
    )

async def handle_category_selection(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка выбора категории"""
    query = update.callback_query
    await query.answer()
    
    if query.data == "back_to_main":
        await query.message.edit_text(
            "Выберите действие в меню ниже:",
            reply_markup=main_menu
        )
        return
    
    if query.data == "category_electronics":
        await query.message.edit_text(
            "Выберите подкатегорию:",
            reply_markup=electronics_subcategories
        )
    else:
        # Показываем сортировку для других категорий
        await query.message.edit_text(
            "Сортировка объявлений:",
            reply_markup=sort_keyboard
        )

async def handle_sort_selection(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка выбора сортировки"""
    query = update.callback_query
    await query.answer()
    
    if query.data == "back_to_categories":
        await query.message.edit_text(
            "Выберите категорию:",
            reply_markup=categories_keyboard
        )
        return
    
    # Здесь будет логика загрузки объявлений с выбранной сортировкой
    await query.message.edit_text(
        "📄 Объявления загружаются...\n\n(Здесь будут показаны объявления)",
        reply_markup=ad_actions_keyboard
    )

async def create_ad_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Начало создания объявления"""
    user_id = update.effective_user.id
    user_states[user_id] = UserState()
    user_states[user_id].step = "photo"
    
    await update.message.reply_text(
        "Создание объявления - Шаг 1\n\n"
        "📸 Отправьте фото (можно несколько)\n"
        "Когда закончите, отправьте /next",
        reply_markup=cancel_keyboard
    )

async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка фотографий"""
    user_id = update.effective_user.id
    
    if user_id in user_states:
        state = user_states[user_id]
        
        if state.step == 'promo_ad_photos':
            # Обработка фото для рекламного объявления
            photos = state.temp_data.get('photos', [])
            
            if len(photos) < 5:
                # Получаем file_id фото
                file_id = update.message.photo[-1].file_id
                photos.append(file_id)
                state.temp_data['photos'] = photos
                
                if len(photos) == 1:
                    await update.message.reply_text(
                        f"📸 Фото добавлено (1/5)\n\n"
                        f"Отправьте еще фото или нажмите \"Готово\" если достаточно:"
                    )
                elif len(photos) < 5:
                    await update.message.reply_text(
                        f"📸 Фото добавлено ({len(photos)}/5)\n\n"
                        f"Отправьте еще фото или нажмите \"Готово\" если достаточно:"
                    )
                else:
                    await update.message.reply_text(
                        f"📸 Максимум фото добавлен (5/5)\n\n"
                        f"Переходим к следующему шагу..."
                    )
                    # Переходим к следующему шагу
                    await skip_promo_photos(update, context)
            return
        
        elif state.step == 'photo':
            # Обработка фото для обычного объявления
            photos = state.temp_data.get('photos', [])
            
            if len(photos) < 5:
                file_id = update.message.photo[-1].file_id
                photos.append(file_id)
                state.temp_data['photos'] = photos
                
                if len(photos) == 1:
                    await update.message.reply_text(
                        f"📸 Фото добавлено (1/5)\n\n"
                        f"Отправьте еще фото или нажмите \"Готово\" если достаточно:"
                    )
                else:
                    await update.message.reply_text(
                        f"📸 Фото добавлено ({len(photos)}/5)\n\n"
                        f"Отправьте еще фото или нажмите \"Готово\" если достаточно:"
                    )
            return
    
    # Если фото отправлено не в процессе создания объявления
    await update.message.reply_text(
        "Пожалуйста, сначала начните создание объявления через главное меню."
    )

async def next_step(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Переход к следующему шагу создания объявления"""
    user_id = update.effective_user.id
    
    if user_id not in user_states:
        return
    
    state = user_states[user_id]
    
    if state.step == "photo":
        state.step = "title"
        await update.message.reply_text(
            "Создание объявления - Шаг 2\n\n"
            "📝 Введите название объявления:"
        )
    elif state.step == "title":
        if update.message.text:
            state.temp_data['title'] = update.message.text
            state.step = "description"
            await update.message.reply_text(
                "Создание объявления - Шаг 3\n\n"
                "📝 Введите описание объявления:"
            )
    elif state.step == "description":
        if update.message.text:
            state.temp_data['description'] = update.message.text
            state.step = "category"
            await update.message.reply_text(
                "Создание объявления - Шаг 4\n\n"
                "📂 Выберите категорию:",
                reply_markup=categories_keyboard
            )
    elif state.step == "price":
        if update.message.text:
            try:
                price = float(update.message.text)
                state.temp_data['price'] = price
                state.step = "location"
                await update.message.reply_text(
                    "Создание объявления - Шаг 6\n\n"
                    "📍 Отправьте геопозицию (метка через телеграм)",
                    reply_markup=location_keyboard
                )
            except ValueError:
                await update.message.reply_text("❌ Неверный формат цены. Введите число:")

async def handle_location(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка геолокации"""
    user_id = update.effective_user.id
    
    if user_id not in user_states or user_states[user_id].step != "location":
        return
    
    location = update.message.location
    user_states[user_id].temp_data['location'] = {
        'latitude': location.latitude,
        'longitude': location.longitude
    }
    
    # Проверка лимита объявлений
    user = await get_or_create_user(update.effective_user)
    user_ads = await db.get_user_ads(user['id'], 'active')
    active_count = len(user_ads)
    
    if active_count >= FREE_ADS_LIMIT:
        await update.message.reply_text(
            f"📊 У вас использовано: {active_count} / {FREE_ADS_LIMIT} бесплатных объявлений\n\n"
            f"➕ Следующее объявление — {AD_PRICE} ₽\n\n"
            "[💳 Оплатить]\n"
            "[❌ Отмена]",
            reply_markup=cancel_keyboard
        )
    else:
        # Публикация объявления
        await publish_ad(update, user, user_states[user_id].temp_data)
        del user_states[user_id]

async def publish_ad(update, user: dict, ad_data: dict):
    """Публикация объявления"""
    ad_data['user_id'] = user['id']
    ad_data['status'] = 'active'
    ad_data['created_at'] = datetime.utcnow().isoformat()
    
    ad = await db.create_ad(ad_data)
    
    if ad:
        await update.message.reply_text(
            "✅ Объявление опубликовано!\n\n"
            "Хотите продвинуть объявление?",
            reply_markup=promotion_keyboard
        )
        
        # Отправка в канал (если настроен)
        if CHANNEL_ID:
            try:
                await send_ad_to_channel(update, ad)
            except Exception as e:
                logger.error(f"Ошибка отправки в канал: {e}")
    else:
        await update.message.reply_text(
            "❌ Ошибка при публикации объявления. Попробуйте еще раз."
        )

async def send_ad_to_channel(update, ad: dict):
    """Отправка объявления в канал"""
    text = f"📸 {ad['title']}\n\n"
    
    if ad.get('price'):
        text += f"💰 {ad['price']:.0f} ₽\n\n"
    
    text += f"📝 {ad['description']}\n\n"
    text += f"📍 Михайловск\n"
    text += f"📅 {datetime.fromisoformat(ad['created_at']).strftime('%d.%m.%Y')}"
    
    await update.bot.send_message(
        chat_id=CHANNEL_ID,
        text=text,
        disable_web_page_preview=True
    )

async def create_promo_ad_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Начало создания рекламного объявления"""
    query = update.callback_query
    await query.answer()
    
    user_id = update.effective_user.id
    
    # Инициализируем состояние для рекламного объявления
    user_states[user_id] = UserState()
    user_states[user_id].step = 'promo_ad_photos'
    user_states[user_id].temp_data['is_promo'] = True
    
    await query.message.edit_text(
        "📢 **Создание рекламного объявления**\n\n"
        "Шаг 1/7: Отправьте 1-5 фотографий для рекламы\n\n"
        "📸 **Требования к фото:**\n"
        "• Хорошее качество\n"
        "• Релевантность рекламе\n"
        "• Без водяных знаков других сервисов\n\n"
        "Отправьте фото или нажмите \"Пропустить\" если фото не нужно:",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("⏭ Пропустить", callback_data="skip_promo_photos")]
        ])
    )

async def skip_promo_photos(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Пропуск фото для рекламного объявления"""
    query = update.callback_query
    await query.answer()
    
    user_id = update.effective_user.id
    if user_id in user_states:
        user_states[user_id].step = 'promo_ad_title'
        user_states[user_id].temp_data['photos'] = []
    
    await query.message.edit_text(
        "📢 **Создание рекламного объявления**\n\n"
        "Шаг 2/7: Введите заголовок рекламы\n\n"
        "💡 **Примеры хороших заголовков:**\n"
        "• \"Скидка 50% на все пиццы до конца недели!\"\n"
        "• \"Открытие нового магазина одежды\"\n"
        "• \"Ремонт квартир под ключ\"\n\n"
        "Максимальная длина - 100 символов. Введите заголовок:"
    )

async def handle_promo_duration(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка выбора срока размещения рекламного объявления"""
    query = update.callback_query
    await query.answer()
    
    user_id = update.effective_user.id
    duration = query.data.split('_')[1]
    
    if user_id in user_states:
        state = user_states[user_id]
        
        # Определяем стоимость и срок
        if duration == '30':
            state.temp_data['duration'] = 30
            extra_cost = 0
        elif duration == '90':
            state.temp_data['duration'] = 90
            extra_cost = 100
        elif duration == '120':
            state.temp_data['duration'] = 120
            extra_cost = 200
        else:
            state.temp_data['duration'] = 30
            extra_cost = 0
        
        state.temp_data['extra_cost'] = extra_cost
        
        # Показываем финальное подтверждение
        await show_promo_ad_confirmation(update, context)

async def show_promo_ad_confirmation(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать подтверждение создания рекламного объявления"""
    query = update.callback_query
    user_id = update.effective_user.id
    
    if user_id not in user_states:
        return
    
    state = user_states[user_id]
    data = state.temp_data
    
    # Формируем текст для подтверждения
    text = f"📢 **Проверьте рекламное объявление:**\n\n"
    text += f"📝 **Заголовок:** {data.get('title', 'Не указано')}\n\n"
    text += f"📄 **Описание:** {data.get('description', 'Не указано')}\n\n"
    
    if data.get('price'):
        text += f"💰 **Цена:** {data['price']:.0f} ₽\n\n"
    
    if data.get('contacts'):
        text += f"📞 **Контакты:** {data['contacts']}\n\n"
    
    text += f"⏰ **Срок размещения:** {data.get('duration', 30)} дней\n"
    text += f"💳 **Стоимость:** 50 ₽"
    
    if data.get('extra_cost', 0) > 0:
        text += f" + {data['extra_cost']} ₽ = {50 + data['extra_cost']} ₽"
    
    text += "\n\nВсё верно? Опубликуем рекламу?"
    
    await query.message.edit_text(
        text,
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton(f"💳 Оплатить {50 + data.get('extra_cost', 0)} ₽", callback_data="confirm_promo_ad")],
            [InlineKeyboardButton("✏ Изменить", callback_data="edit_promo_ad")],
            [InlineKeyboardButton("❌ Отменить", callback_data="cancel_promo_ad")]
        ])
    )

async def confirm_promo_ad_payment(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Подтверждение и оплата рекламного объявления"""
    query = update.callback_query
    await query.answer()
    
    user_id = update.effective_user.id
    
    if user_id not in user_states:
        return
    
    state = user_states[user_id]
    data = state.temp_data
    extra_cost = data.get('extra_cost', 0)
    total_cost = 50 + extra_cost
    
    # Создаем платеж для рекламного объявления
    if extra_cost > 0:
        # Если есть доп. стоимость, создаем специальный платеж
        await query.bot.send_invoice(
            chat_id=query.message.chat_id,
            title="Рекламное объявление (продленный срок)",
            description=f"Размещение рекламного объявления на {data.get('duration', 30)} дней",
            payload=f"promo_ad_extended_{user_id}_{datetime.now().timestamp()}",
            provider_token=PAYMENT_PROVIDER_TOKEN,
            currency="RUB",
            prices=[LabeledPrice(label="Рекламное объявление", amount=total_cost * 100)],
            need_name=True,
            need_phone_number=True,
            need_email=True,
            is_flexible=False
        )
    else:
        # Стандартная оплата
        await query.bot.send_invoice(
            chat_id=query.message.chat_id,
            title="Рекламное объявление",
            description="Размещение рекламного объявления на 30 дней",
            payload=f"promo_ad_{user_id}_{datetime.now().timestamp()}",
            provider_token=PAYMENT_PROVIDER_TOKEN,
            currency="RUB",
            prices=[LabeledPrice(label="Рекламное объявление", amount=50 * 100)],
            need_name=True,
            need_phone_number=True,
            need_email=True,
            is_flexible=False
        )

async def edit_promo_ad(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Редактирование рекламного объявления"""
    query = update.callback_query
    await query.answer()
    
    # Возвращаем к первому шагу
    await create_promo_ad_start(update, context)

async def cancel_promo_ad(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Отмена рекламного объявления"""
    query = update.callback_query
    await query.answer()
    
    user_id = update.effective_user.id
    
    if user_id in user_states:
        del user_states[user_id]
    
    await query.message.edit_text(
        "❌ Создание рекламного объявления отменено",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🏠 Главное меню", callback_data="back_to_main")]
        ])
    )

async def cancel_creation(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Отмена создания объявления"""
    user_id = update.effective_user.id
    
    if user_id in user_states:
        del user_states[user_id]
    
    await update.message.reply_text(
        "❌ Создание объявления отменено",
        reply_markup=main_menu
    )

async def show_favorites(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать избранные объявления"""
    await update.message.reply_text(
        "❤️ Ваши избранные объявления:\n\n"
        "📌 Объявление #1\n"
        "📌 Объявление #2\n\n"
        "(Здесь будут ваши избранные объявления)",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("💬 Написать автору", callback_data="contact_author")],
            [InlineKeyboardButton("❌ Убрать из избранного", callback_data="remove_from_favorites")],
            [InlineKeyboardButton("⬅ Назад", callback_data="back_to_main")]
        ])
    )

async def show_search(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать поиск"""
    await update.message.reply_text(
        "🔍 Введите слово для поиска:\n"
        "(например: айфон, диван, работа)\n\n"
        "➕ Фильтры:",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("📂 Категория", callback_data="filter_category")],
            [InlineKeyboardButton("💰 Цена от / до", callback_data="filter_price")],
            [InlineKeyboardButton("📍 Расстояние", callback_data="filter_distance")],
            [InlineKeyboardButton("⬅ Назад", callback_data="back_to_main")]
        ])
    )

async def show_settings(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать настройки"""
    await update.message.reply_text(
        "⚙ Настройки Lavka26",
        reply_markup=settings_keyboard
    )

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка всех callback кнопок"""
    query = update.callback_query
    await query.answer()
    
    # Здесь будет логика обработки всех callback
    if query.data == "back_to_main":
        await query.message.edit_text(
            "Выберите действие в меню ниже:",
            reply_markup=main_menu
        )
    elif query.data.startswith("promote_") or query.data.startswith("boost_") or query.data == "pin_month":
        # Передаем обработку в handlers.py
        from handlers import handle_promotion
        await handle_promotion(update, context)
    elif query.data == "create_promo_ad":
        # Создание рекламного объявления
        await create_promo_ad_start(update, context)
    elif query.data == "skip_promo_photos":
        # Пропуск фото для рекламного объявления
        await skip_promo_photos(update, context)
    elif query.data.startswith("duration_"):
        # Обработка выбора срока размещения рекламного объявления
        await handle_promo_duration(update, context)
    elif query.data == "confirm_promo_ad":
        # Подтверждение и оплата рекламного объявления
        await confirm_promo_ad_payment(update, context)
    elif query.data == "edit_promo_ad":
        # Редактирование рекламного объявления
        await edit_promo_ad(update, context)
    elif query.data == "cancel_promo_ad":
        # Отмена рекламного объявления
        await cancel_promo_ad(update, context)

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка текстовых сообщений"""
    user_id = update.effective_user.id
    text = update.message.text
    
    # Обработка кнопок главного меню
    if text == "📄 Смотреть объявления":
        await show_categories(update, context)
    elif text == "➕ Создать объявление":
        await create_ad_start(update, context)
    elif text == "❤️ Избранное":
        await show_favorites(update, context)
    elif text == "🔍 Поиск":
        await show_search(update, context)
    elif text == "⚙ Настройки":
        await show_settings(update, context)
    elif text == "❌ Отмена":
        await cancel_creation(update, context)
    # Обработка шагов создания объявления
    elif user_id in user_states:
        state = user_states[user_id]
        
        if state.step == 'promo_ad_title':
            # Обработка заголовка рекламного объявления
            if len(text) <= 100:
                state.temp_data['title'] = text
                state.step = 'promo_ad_description'
                
                await update.message.reply_text(
                    "📢 **Создание рекламного объявления**\n\n"
                    "Шаг 3/7: Введите описание рекламы\n\n"
                    "💡 **Что указать в описании:**\n"
                    "• Подробности о товаре/услуге\n"
                    "• Условия акции\n"
                    "• Контакты для связи\n"
                    "• Срок действия предложения\n\n"
                    "Максимальная длина - 500 символов. Введите описание:"
                )
            else:
                await update.message.reply_text(
                    "❌ Слишком длинный заголовок. Максимум 100 символов.\n\n"
                    "Пожалуйста, введите заголовок еще раз:"
                )
        
        elif state.step == 'promo_ad_description':
            # Обработка описания рекламного объявления
            if len(text) <= 500:
                state.temp_data['description'] = text
                state.step = 'promo_ad_price'
                
                await update.message.reply_text(
                    "📢 **Создание рекламного объявления**\n\n"
                    "Шаг 4/7: Укажите цену (если есть)\n\n"
                    "💡 **Цена в рекламе:**\n"
                    "• Укажите конкретную цену\n"
                    "• Или напишите \"Бесплатно\"\n"
                    "• Или \"Цена по запросу\"\n\n"
                    "Введите цену или напишите \"Пропустить\":"
                )
            else:
                await update.message.reply_text(
                    "❌ Слишком длинное описание. Максимум 500 символов.\n\n"
                    "Пожалуйста, введите описание еще раз:"
                )
        
        elif state.step == 'promo_ad_price':
            # Обработка цены рекламного объявления
            if text.lower() == 'пропустить':
                state.temp_data['price'] = None
            else:
                try:
                    # Пытаемся извлечь число из текста
                    import re
                    numbers = re.findall(r'\d+', text.replace(' ', ''))
                    if numbers:
                        state.temp_data['price'] = float(numbers[0])
                    else:
                        state.temp_data['price'] = None
                except:
                    state.temp_data['price'] = None
            
            state.step = 'promo_ad_contacts'
            
            await update.message.reply_text(
                "📢 **Создание рекламного объявления**\n\n"
                "Шаг 5/7: Укажите контакты для связи\n\n"
                "💡 **Какие контакты указать:**\n"
                "• Телефон\n"
                "• Telegram username\n"
                "• Адрес\n"
                "• Сайт\n\n"
                "Введите контакты или напишите \"Пропустить\":"
            )
        
        elif state.step == 'promo_ad_contacts':
            # Обработка контактов рекламного объявления
            if text.lower() == 'пропустить':
                state.temp_data['contacts'] = None
            else:
                state.temp_data['contacts'] = text
            
            state.step = 'promo_ad_duration'
            
            await update.message.reply_text(
                "📢 **Создание рекламного объявления**\n\n"
                "Шаг 6/7: Выберите срок размещения\n\n"
                "💰 **Дополнительные опции:**\n"
                "• 30 дней (включено в оплату)\n"
                "• +60 дней за 100 ₽\n"
                "• +90 дней за 200 ₽\n\n"
                "Выберите вариант:",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("30 дней (стандарт)", callback_data="duration_30")],
                    [InlineKeyboardButton("90 дней (+100 ₽)", callback_data="duration_90")],
                    [InlineKeyboardButton("120 дней (+200 ₽)", callback_data="duration_120")]
                ])
            )
        
        else:
            # Для остальных шагов используем обычную логику
            await next_step(update, context)
    else:
        # Обработка шагов создания объявления
        await next_step(update, context)

def main():
    """Основная функция"""
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    
    # Настройка обработчиков
    setup_handlers(app)
    setup_payment_handlers(app)
    
    # Команды
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("next", next_step))
    
    # Сообщения
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    app.add_handler(MessageHandler(filters.PHOTO, handle_photo))
    app.add_handler(MessageHandler(filters.LOCATION, handle_location))
    
    # Callback кнопки
    app.add_handler(CallbackQueryHandler(handle_callback))
    
    # Запуск бота
    app.run_polling()

async def init_all():
    """Инициализация всех компонентов"""
    logger.info("🚀 Инициализация бота Lavka26...")
    
    # Тест подключения к Supabase
    if await db.test_connection():
        logger.info("✅ Подключение к базе данных успешно")
    else:
        logger.error("❌ Ошибка подключения к базе данных")
        return False
    
    # Инициализация категорий
    await init_categories()
    
    logger.info("✅ Инициализация завершена")
    return True

if __name__ == '__main__':
    # Инициализация перед запуском
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    if loop.run_until_complete(init_all()):
        logger.info("🚀 Запуск бота...")
        main()
    else:
        logger.error("❌ Ошибка инициализации. Бот не запущен.")
        loop.close()
