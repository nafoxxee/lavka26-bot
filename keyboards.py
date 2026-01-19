from telegram import InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup, KeyboardButton

# Главное меню
main_menu = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton("📄 Смотреть объявления")],
        [KeyboardButton("➕ Создать объявление")],
        [KeyboardButton("❤️ Избранное"), KeyboardButton("🔍 Поиск")],
        [KeyboardButton("⚙ Настройки")]
    ],
    resize_keyboard=True,
    keyboard_size=3
)

# Категории
categories_keyboard = InlineKeyboardMarkup(
    inline_keyboard=[
        [InlineKeyboardButton("🚗 Транспорт", callback_data="category_transport")],
        [InlineKeyboardButton("🏠 Недвижимость", callback_data="category_real_estate")],
        [InlineKeyboardButton("💼 Работа", callback_data="category_jobs")],
        [InlineKeyboardButton("🛠 Услуги", callback_data="category_services")],
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
    ]
)

# Подкатегории электроники
electronics_subcategories = InlineKeyboardMarkup(
    inline_keyboard=[
        [InlineKeyboardButton("📱 Телефоны", callback_data="subcategory_phones")],
        [InlineKeyboardButton("💻 Компьютеры", callback_data="subcategory_computers")],
        [InlineKeyboardButton("🎧 Аудио и видео", callback_data="subcategory_audio_video")],
        [InlineKeyboardButton("📺 ТВ", callback_data="subcategory_tv")],
        [InlineKeyboardButton("⌚ Гаджеты", callback_data="subcategory_gadgets")],
        [InlineKeyboardButton("⬅ Назад", callback_data="back_to_categories")]
    ]
)

# Сортировка объявлений
sort_keyboard = InlineKeyboardMarkup(
    inline_keyboard=[
        [InlineKeyboardButton("🆕 Сначала новые", callback_data="sort_new")],
        [InlineKeyboardButton("💰 Цена ↑", callback_data="sort_price_asc")],
        [InlineKeyboardButton("💰 Цена ↓", callback_data="sort_price_desc")],
        [InlineKeyboardButton("📍 Ближе ко мне", callback_data="sort_location")],
        [InlineKeyboardButton("⬅ Назад", callback_data="back_to_categories")]
    ]
)

# Действия с объявлением
ad_actions_keyboard = InlineKeyboardMarkup(
    inline_keyboard=[
        [InlineKeyboardButton("💬 Написать автору", callback_data="contact_author")],
        [InlineKeyboardButton("❤️ В избранное", callback_data="add_to_favorites")],
        [InlineKeyboardButton("⬅ Назад", callback_data="back_to_ads")]
    ]
)

# Продвижение объявления
promotion_keyboard = InlineKeyboardMarkup(
    inline_keyboard=[
        [InlineKeyboardButton("🚀 Поднять объявление", callback_data="promote_boost")],
        [InlineKeyboardButton("📌 Закрепить объявление", callback_data="promote_pin")],
        [InlineKeyboardButton("🏠 Главное меню", callback_data="back_to_main")]
    ]
)

# Варианты поднятия объявления
boost_options = InlineKeyboardMarkup(
    inline_keyboard=[
        [InlineKeyboardButton("⏱ На сутки — 50 ₽", callback_data="boost_day")],
        [InlineKeyboardButton("📅 На неделю — 200 ₽", callback_data="boost_week")],
        [InlineKeyboardButton("⬅ Назад", callback_data="back_to_ad")]
    ]
)

# Закрепление объявления
pin_option = InlineKeyboardMarkup(
    inline_keyboard=[
        [InlineKeyboardButton("📆 На месяц — 500 ₽", callback_data="pin_month")],
        [InlineKeyboardButton("⬅ Назад", callback_data="back_to_ad")]
    ]
)

# Настройки
settings_keyboard = InlineKeyboardMarkup(
    inline_keyboard=[
        [InlineKeyboardButton("📄 Мои объявления", callback_data="my_ads")],
        [InlineKeyboardButton("🔔 Уведомления", callback_data="notifications")],
        [InlineKeyboardButton("💳 История оплат", callback_data="payment_history")],
        [InlineKeyboardButton("📞 Поддержка", callback_data="support")],
        [InlineKeyboardButton("⬅ Назад", callback_data="back_to_main")]
    ]
)

# Мои объявления - статусы
my_ads_keyboard = InlineKeyboardMarkup(
    inline_keyboard=[
        [InlineKeyboardButton("📌 Активные", callback_data="my_ads_active")],
        [InlineKeyboardButton("⌛ На модерации", callback_data="my_ads_moderation")],
        [InlineKeyboardButton("🗑 Архив", callback_data="my_ads_archived")],
        [InlineKeyboardButton("⬅ Назад", callback_data="back_to_settings")]
    ]
)

# Действия с моим объявлением
my_ad_actions = InlineKeyboardMarkup(
    inline_keyboard=[
        [InlineKeyboardButton("✏ Редактировать", callback_data="edit_ad")],
        [InlineKeyboardButton("🚀 Продвинуть", callback_data="promote_my_ad")],
        [InlineKeyboardButton("❌ Удалить", callback_data="delete_ad")],
        [InlineKeyboardButton("⬅ Назад", callback_data="back_to_my_ads")]
    ]
)

# Кнопка отправки геолокации
location_keyboard = ReplyKeyboardMarkup(
    keyboard=[[KeyboardButton("📍 Отправить геопозицию", request_location=True)]],
    resize_keyboard=True
)

# Кнопка отмены
cancel_keyboard = ReplyKeyboardMarkup(
    keyboard=[[KeyboardButton("❌ Отмена")]],
    resize_keyboard=True
)
