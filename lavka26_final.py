#!/usr/bin/env python3
"""
Lavka26 Bot - Полноценная версия с рекламными объявлениями
Торговая площадка объявлений города Михайловска с монетизацией
"""

import asyncio
import logging
import os
from datetime import datetime, timedelta
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, BotCommand, LabeledPrice
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes

# Загрузка конфигурации
def load_config():
    """Загрузка конфигурации из .env файла"""
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
    
    # Проверка обязательных полей
    required_fields = ['TELEGRAM_BOT_TOKEN', 'SUPABASE_URL', 'SUPABASE_KEY']
    for field in required_fields:
        if not config.get(field):
            print(f"❌ Обязательное поле {field} отсутствует в .env")
            return None
    
    return config

config = load_config()
if not config:
    exit(1)

# Константы
TELEGRAM_BOT_TOKEN = config['TELEGRAM_BOT_TOKEN']
SUPABASE_URL = config['SUPABASE_URL']
SUPABASE_KEY = config['SUPABASE_KEY']
PAYMENT_PROVIDER_TOKEN = config.get('PAYMENT_PROVIDER_TOKEN', '')
ADMIN_ID = int(config.get('ADMIN_ID', 0))
CHANNEL_ID = config.get('CHANNEL_ID', '')

# Цены
FREE_ADS_LIMIT = 5
AD_PRICE = 100
PROMO_AD_PRICE = 50
PROMOTION_PRICES = {
    'boost_day': 50,
    'boost_week': 200,
    'pin_month': 500
}

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Состояния пользователей
user_states = {}

class UserState:
    def __init__(self):
        self.step = None
        self.temp_data = {}

# Клавиатуры
main_menu = InlineKeyboardMarkup([
    [InlineKeyboardButton("📄 Смотреть объявления", callback_data="browse_ads")],
    [InlineKeyboardButton("➕ Создать объявление", callback_data="create_ad")],
    [InlineKeyboardButton("📢 Реклама (50 ₽)", callback_data="promo_ads")],
    [InlineKeyboardButton("❤️ Избранное", callback_data="favorites")],
    [InlineKeyboardButton("🔍 Поиск", callback_data="search")],
    [InlineKeyboardButton("⚙ Настройки", callback_data="settings")]
])

categories_keyboard = InlineKeyboardMarkup([
    [InlineKeyboardButton("👕 Личные вещи", callback_data="category_personal")],
    [InlineKeyboardButton("📱 Электроника", callback_data="category_electronics")],
    [InlineKeyboardButton("🌿 Дом и сад", callback_data="category_home_garden")],
    [InlineKeyboardButton("🐶 Животные", callback_data="category_animals")],
    [InlineKeyboardButton("🎮 Хобби и отдых", callback_data="category_hobby")],
    [InlineKeyboardButton("🏭 Для бизнеса", callback_data="category_business")],
    [InlineKeyboardButton("💄 Красота и здоровье", callback_data="category_beauty")],
    [InlineKeyboardButton("✈ Билеты и путешествия", callback_data="category_travel")],
    [InlineKeyboardButton("🏗 Строительство и ремонт", callback_data="category_construction")],
    [InlineKeyboardButton("📦 Прочее", callback_data="category_other")],
    [InlineKeyboardButton("📢 Реклама (50 ₽)", callback_data="category_promo")],
    [InlineKeyboardButton("⬅ Назад", callback_data="back_to_main")]
])

# База данных (имитация для демонстрации)
class Database:
    def __init__(self):
        self.ads = []
        self.users = []
        self.payments = []
    
    async def test_connection(self):
        return True
    
    async def get_or_create_user(self, telegram_id, username=None, first_name=None, last_name=None):
        user = next((u for u in self.users if u['telegram_id'] == telegram_id), None)
        if not user:
            user = {
                'id': len(self.users) + 1,
                'telegram_id': telegram_id,
                'username': username,
                'first_name': first_name,
                'last_name': last_name,
                'created_at': datetime.now().isoformat()
            }
            self.users.append(user)
        return user
    
    async def create_ad(self, ad_data):
        ad = {
            'id': len(self.ads) + 1,
            **ad_data,
            'created_at': datetime.now().isoformat()
        }
        self.ads.append(ad)
        return ad
    
    async def get_user_ads(self, user_id, status='active'):
        return [ad for ad in self.ads if ad.get('user_id') == user_id and ad.get('status') == status]

db = Database()

# Основные функции
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
    await get_or_create_user(user)
    
    welcome_text = f"""👋 Добро пожаловать в Lavka26
Торговая площадка объявлений города Михайловска

📢 **НОВИНКА! Размещение рекламы от 50 ₽**

Выберите действие в меню ниже:"""
    
    await update.message.reply_text(welcome_text, reply_markup=main_menu)

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка callback кнопок"""
    query = update.callback_query
    await query.answer()
    
    if query.data == "back_to_main":
        await query.message.edit_text(
            "Выберите действие в меню ниже:",
            reply_markup=main_menu
        )
    
    elif query.data == "browse_ads":
        await query.message.edit_text(
            "Выберите категорию:",
            reply_markup=categories_keyboard
        )
    
    elif query.data == "category_promo":
        await handle_promo_category(update, context)
    
    elif query.data == "promo_info":
        await handle_promo_info(update, context)
    
    elif query.data == "back_to_categories":
        await query.message.edit_text(
            "Выберите категорию:",
            reply_markup=categories_keyboard
        )
    
    elif query.data == "pay_for_promo_ad":
        await handle_promo_payment(update, context)
    
    elif query.data == "create_promo_ad":
        await create_promo_ad_start(update, context)
    
    elif query.data == "skip_promo_photos":
        await skip_promo_photos(update, context)
    
    elif query.data.startswith("duration_"):
        await handle_promo_duration(update, context)
    
    elif query.data == "confirm_promo_ad":
        await confirm_promo_ad_payment(update, context)
    
    elif query.data == "edit_promo_ad":
        await create_promo_ad_start(update, context)
    
    elif query.data == "cancel_promo_ad":
        await cancel_promo_ad(update, context)
    
    else:
        # Для других категорий
        await query.message.edit_text(
            f"📄 Категория: {query.data}\n\n"
            "🔧 **В разработке**\n\n"
            "Эта категория будет доступна в следующей версии.\n\n"
            "📢 **Рекламные объявления** уже готовы - выберите \"📢 Реклама (50 ₽)\"",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("⬅ Назад", callback_data="back_to_categories")]
            ])
        )

async def handle_promo_category(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка категории Реклама"""
    query = update.callback_query
    
    if PAYMENT_PROVIDER_TOKEN:
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
    else:
        await query.message.edit_text(
            "📢 **Рекламные объявления**\n\n"
            "Разместите вашу рекламу для жителей Михайловска!\n\n"
            "💰 **Стоимость: 50 ₽**\n"
            "⏰ **Срок: 30 дней**\n"
            "👁️ **Показы: всем пользователям бота**\n\n"
            "⚠️ **ВНИМАНИЕ:** Функция оплаты временно отключена\n\n"
            "Для подключения платежей свяжитесь с администратором.\n\n"
            "📋 **Что будет доступно после оплаты:**\n"
            "• Размещение в специальной категории\n"
            "• Выделение значком 📢\n"
            "• Показ всем пользователям бота\n"
            "• Срок размещения 30 дней",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("ℹ️ Подробнее о рекламе", callback_data="promo_info")],
                [InlineKeyboardButton("⬅ Назад", callback_data="back_to_categories")]
            ])
        )

async def handle_promo_info(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать подробную информацию о рекламе"""
    query = update.callback_query
    
    await query.message.edit_text(
        "📢 **Подробнее о рекламе в Lavka26**\n\n"
        "**Что вы получаете за 50 ₽:**\n"
        "• Размещение в специальной категории \"Реклама\"\n"
        "• Выделение значком 📢 в общем списке\n"
        "• Показ всем пользователям бота\n"
        "• Срок размещения - 30 дней\n\n"
        "**Дополнительные опции:**\n"
        "• 90 дней - 150 ₽ (+100 ₽)\n"
        "• 120 дней - 250 ₽ (+200 ₽)\n\n"
        "**Что можно рекламировать:**\n"
        "• Товары и услуги\n"
        "• Мероприятия и акции\n"
        "• Компании и бренды\n"
        "• Другие объявления\n\n"
        "**Требования:**\n"
        "• Соответствие законодательству РФ\n"
        "• Отсутствие запрещенной тематики\n"
        "• Проверка модератором\n\n"
        "**Преимущества рекламы в Lavka26:**\n"
        "• Целевая аудитория - жители Михайловска\n"
        "• Низкая стоимость по сравнению с конкурентами\n"
        "• Быстрый запуск и публикация\n"
        "• Удобная оплата через Telegram",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("💳 Оплатить 50 ₽", callback_data="pay_for_promo_ad")] if PAYMENT_PROVIDER_TOKEN else [InlineKeyboardButton("ℹ️ Оплата отключена", callback_data="noop")],
            [InlineKeyboardButton("⬅ Назад", callback_data="back_to_categories")]
        ])
    )

async def handle_promo_payment(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка платежа за рекламу"""
    query = update.callback_query
    
    if not PAYMENT_PROVIDER_TOKEN:
        await query.message.edit_text(
            "⚠️ **Платежи временно отключены**\n\n"
            "Для подключения платежей свяжитесь с администратором.\n\n"
            "Как только платежи будут включены, вы сможете:\n"
            "• Оплатить рекламное объявление\n"
            "• Создать рекламу за 50 ₽\n"
            "• Выбрать продленный срок",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("⬅ Назад", callback_data="back_to_categories")]
            ])
        )
        return
    
    # Создаем инвойс для оплаты
    await query.bot.send_invoice(
        chat_id=query.message.chat_id,
        title="Рекламное объявление",
        description="Размещение рекламного объявления в Lavka26 на 30 дней",
        payload=f"promo_ad_{query.from_user.id}_{datetime.now().timestamp()}",
        provider_token=PAYMENT_PROVIDER_TOKEN,
        currency="RUB",
        prices=[LabeledPrice(label="Рекламное объявление", amount=50 * 100)],
        need_name=True,
        need_phone_number=True,
        need_email=True,
        is_flexible=False
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
    """Обработка выбора срока размещения"""
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
    
    if not PAYMENT_PROVIDER_TOKEN:
        await query.message.edit_text(
            "⚠️ **Платежи отключены**\n\n"
            "Свяжитесь с администратором для подключения платежей.",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("⬅ Назад", callback_data="back_to_main")]
            ])
        )
        return
    
    user_id = update.effective_user.id
    
    if user_id not in user_states:
        return
    
    state = user_states[user_id]
    data = state.temp_data
    extra_cost = data.get('extra_cost', 0)
    total_cost = 50 + extra_cost
    
    # Создаем платеж
    if extra_cost > 0:
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

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка текстовых сообщений"""
    user_id = update.effective_user.id
    text = update.message.text
    
    # Обработка кнопок главного меню
    if text == "📄 Смотреть объявления":
        await update.message.reply_text(
            "Выберите категорию:",
            reply_markup=categories_keyboard
        )
    elif text == "➕ Создать объявление":
        await update.message.reply_text(
            "🔧 **В разработке**\n\n"
            "Создание обычных объявлений будет доступно в следующей версии.\n\n"
            "📢 **Рекламные объявления** уже готовы - выберите \"📄 Смотреть объявления\" → \"📢 Реклама (50 ₽)\"",
            reply_markup=main_menu
        )
    elif text == "📢 Реклама (50 ₽)":
        await update.message.reply_text(
            "📢 **Рекламные объявления**\n\n"
            "Разместите вашу рекламу для жителей Михайловска!\n\n"
            "💰 **Стоимость: 50 ₽**\n"
            "⏰ **Срок: 30 дней**\n"
            "👁️ **Показы: всем пользователям бота**\n\n"
            "Готовы разместить рекламу?",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("💳 Оплатить 50 ₽", callback_data="pay_for_promo_ad")] if PAYMENT_PROVIDER_TOKEN else [InlineKeyboardButton("ℹ️ Оплата отключена", callback_data="noop")],
                [InlineKeyboardButton("ℹ️ Подробнее о рекламе", callback_data="promo_info")],
                [InlineKeyboardButton("⬅ Назад", callback_data="back_to_main")]
            ])
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
    elif text == "❌ Отмена":
        if user_id in user_states:
            del user_states[user_id]
        await update.message.reply_text(
            "❌ Действие отменено",
            reply_markup=main_menu
        )
    
    # Обработка шагов создания рекламного объявления
    elif user_id in user_states:
        state = user_states[user_id]
        
        if state.step == 'promo_ad_title':
            # Обработка заголовка
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
            # Обработка описания
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
            # Обработка цены
            if text.lower() == 'пропустить':
                state.temp_data['price'] = None
            else:
                try:
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
            # Обработка контактов
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
        await update.message.reply_text(
            "Воспользуйтесь меню кнопок для навигации.",
            reply_markup=main_menu
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
    
    # Если фото отправлено не в процессе создания объявления
    await update.message.reply_text(
        "Пожалуйста, сначала начните создание объявления через главное меню."
    )

async def successful_payment(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка успешной оплаты"""
    payment = update.message.successful_payment
    user_id = update.effective_user.id
    
    # Извлекаем тип платежа из payload
    payload = payment.invoice_payload
    if 'promo_ad' in payload:
        if 'extended' in payload:
            await update.message.reply_text(
                "✅ Оплата продленного рекламного объявления прошла успешно!\n\n"
                "Теперь вы можете создать рекламное объявление с продленным сроком.",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("📢 Создать рекламное объявление", callback_data="create_promo_ad")],
                    [InlineKeyboardButton("🏠 Главное меню", callback_data="back_to_main")]
                ])
            )
        else:
            await update.message.reply_text(
                "✅ Оплата рекламного объявления прошла успешно!\n\n"
                "Теперь вы можете создать рекламное объявление.",
                reply_markup=InlineKeyboardMarkup([
                    [InlineKeyboardButton("📢 Создать рекламное объявление", callback_data="create_promo_ad")],
                    [InlineKeyboardButton("🏠 Главное меню", callback_data="back_to_main")]
                ])
            )
    else:
        await update.message.reply_text(
            "✅ Оплата прошла успешно!",
            reply_markup=main_menu
        )

def main():
    """Основная функция"""
    if not TELEGRAM_BOT_TOKEN:
        logger.error("❌ TELEGRAM_BOT_TOKEN не найден")
        return
    
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    
    # Команды
    app.add_handler(CommandHandler("start", start_command))
    
    # Сообщения
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    app.add_handler(MessageHandler(filters.PHOTO, handle_photo))
    app.add_handler(MessageHandler(filters.SUCCESSFUL_PAYMENT, successful_payment))
    
    # Callback кнопки
    app.add_handler(CallbackQueryHandler(handle_callback))
    
    # Установка команд
    app.bot.set_my_commands([
        BotCommand("start", "🚀 Запустить бота"),
    ])
    
    logger.info("🚀 Запуск Lavka26 Bot с рекламными объявлениями...")
    logger.info(f"📢 Рекламные объявления: {'✅ Включены' if PAYMENT_PROVIDER_TOKEN else '⚠️ Отключены (нет токена)'}")
    logger.info(f"💰 Стоимость рекламы: {PROMO_AD_PRICE} ₽")
    
    app.run_polling()

if __name__ == '__main__':
    main()
