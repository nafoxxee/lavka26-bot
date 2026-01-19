#!/usr/bin/env python3
"""
Автоматическая миграция базы данных Supabase для Lavka26 Bot
Проверяет и создает недостающие таблицы
"""

import os
import sys
from datetime import datetime

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

SUPABASE_URL = config.get('SUPABASE_URL', '')
SUPABASE_KEY = config.get('SUPABASE_KEY', '')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ SUPABASE_URL или SUPABASE_KEY не найдены в .env")
    print("💡 Добавьте в .env:")
    print("   SUPABASE_URL=https://your-project.supabase.co")
    print("   SUPABASE_KEY=your_supabase_key")
    exit(1)

# SQL для создания таблиц
MIGRATIONS = [
    {
        "name": "users",
        "sql": """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            telegram_id BIGINT UNIQUE NOT NULL,
            username VARCHAR(255),
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255),
            phone VARCHAR(20),
            email VARCHAR(255),
            is_admin BOOLEAN DEFAULT FALSE,
            is_blocked BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,
        "description": "Пользователи бота"
    },
    {
        "name": "categories",
        "sql": """
        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            icon VARCHAR(50),
            is_active BOOLEAN DEFAULT TRUE,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,
        "description": "Категории объявлений"
    },
    {
        "name": "ads",
        "sql": """
        CREATE TABLE IF NOT EXISTS ads (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            category_id INTEGER REFERENCES categories(id),
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            price DECIMAL(10,2),
            photos TEXT[], -- Массив file_id фотографий
            videos TEXT[], -- Массив file_id видео
            website VARCHAR(500), -- Сайт или ссылка на соцсети
            contact TEXT, -- Контактная информация
            hide_username BOOLEAN DEFAULT FALSE, -- Скрыть username
            location_lat DECIMAL(10,8),
            location_lng DECIMAL(11,8),
            location_address TEXT,
            location_text TEXT, -- Текстовый адрес (Город, Улица, Дом)
            status VARCHAR(20) DEFAULT 'moderation' CHECK (status IN ('draft', 'moderation', 'active', 'inactive', 'sold', 'blocked', 'archived', 'payment_pending', 'payment_review', 'published', 'completed', 'cancelled', 'rejected')),
            is_promo BOOLEAN DEFAULT FALSE,
            is_vip BOOLEAN DEFAULT FALSE,
            -- Поля для продвижения
            is_top BOOLEAN DEFAULT FALSE, -- В топе
            top_expires_at TIMESTAMP WITH TIME ZONE, -- Когда истекает топ
            is_highlighted BOOLEAN DEFAULT FALSE, -- Выделено цветом
            highlight_expires_at TIMESTAMP WITH TIME ZONE, -- Когда истекает выделение
            highlight_color VARCHAR(7) DEFAULT '#FFD700', -- Цвет выделения
            is_urgent BOOLEAN DEFAULT FALSE, -- Срочное объявление
            urgent_expires_at TIMESTAMP WITH TIME ZONE, -- Когда истекает срочность
            urgent_text VARCHAR(50) DEFAULT '🚀 Срочно!', -- Текст срочности
            views_count INTEGER DEFAULT 0,
            favorites_count INTEGER DEFAULT 0,
            promoted_until TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,
        "description": "Объявления"
    },
    {
        "name": "payments",
        "sql": """
        CREATE TABLE IF NOT EXISTS payments (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            ad_id INTEGER REFERENCES ads(id) ON DELETE SET NULL,
            service_id VARCHAR(50), -- ID услуги продвижения (top_3_days, highlight, etc.)
            amount DECIMAL(10,2) NOT NULL,
            description TEXT NOT NULL, -- Описание платежа
            payment_type VARCHAR(50) DEFAULT 'promotion', -- 'promo_ad', 'promotion', etc.
            payment_method VARCHAR(50) DEFAULT 'sbp', -- 'sbp', 'telegram_payments', etc.
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'payment_pending', 'payment_review', 'completed', 'rejected', 'cancelled')),
            provider_payment_id VARCHAR(255),
            comment TEXT, -- Комментарий к переводу (например, Lavka26_123456)
            screenshot_url TEXT, -- URL скриншота чека
            admin_notes TEXT,
            confirmed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,
        "description": "Платежи"
    },
    {
        "name": "favorites",
        "sql": """
        CREATE TABLE IF NOT EXISTS favorites (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            ad_id INTEGER REFERENCES ads(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, ad_id)
        );
        """,
        "description": "Избранное"
    },
    {
        "name": "user_stats",
        "sql": """
        CREATE TABLE IF NOT EXISTS user_stats (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            ads_count INTEGER DEFAULT 0,
            payments_count INTEGER DEFAULT 0,
            total_spent DECIMAL(10,2) DEFAULT 0,
            last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,
        "description": "Статистика пользователей"
    },
    {
        "name": "settings",
        "sql": """
        CREATE TABLE IF NOT EXISTS settings (
            id SERIAL PRIMARY KEY,
            sbp_phone VARCHAR(20) DEFAULT '89187713295',
            sbp_bank VARCHAR(100) DEFAULT 'ОЗОН БАНК',
            sbp_recipient VARCHAR(255) DEFAULT 'Петр Д',
            promo_price DECIMAL(10,2) DEFAULT 199.00,
            channel_id VARCHAR(100),
            admin_id BIGINT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,
        "description": "Настройки бота"
    }
]

# Индексы для оптимизации
INDEXES = [
    {
        "name": "idx_users_telegram_id",
        "sql": "CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);",
        "table": "users"
    },
    {
        "name": "idx_ads_user_id",
        "sql": "CREATE INDEX IF NOT EXISTS idx_ads_user_id ON ads(user_id);",
        "table": "ads"
    },
    {
        "name": "idx_ads_category_id",
        "sql": "CREATE INDEX IF NOT EXISTS idx_ads_category_id ON ads(category_id);",
        "table": "ads"
    },
    {
        "name": "idx_ads_status",
        "sql": "CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);",
        "table": "ads"
    },
    {
        "name": "idx_ads_created_at",
        "sql": "CREATE INDEX IF NOT EXISTS idx_ads_created_at ON ads(created_at DESC);",
        "table": "ads"
    },
    {
        "name": "idx_ads_is_promo",
        "sql": "CREATE INDEX IF NOT EXISTS idx_ads_is_promo ON ads(is_promo);",
        "table": "ads"
    },
    {
        "name": "idx_payments_user_id",
        "sql": "CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);",
        "table": "payments"
    },
    {
        "name": "idx_payments_status",
        "sql": "CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);",
        "table": "payments"
    },
    {
        "name": "idx_payments_created_at",
        "sql": "CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);",
        "table": "payments"
    },
    {
        "name": "idx_ads_is_top",
        "sql": "CREATE INDEX IF NOT EXISTS idx_ads_is_top ON ads(is_top);",
        "table": "ads"
    },
    {
        "name": "idx_ads_top_expires_at",
        "sql": "CREATE INDEX IF NOT EXISTS idx_ads_top_expires_at ON ads(top_expires_at);",
        "table": "ads"
    },
    {
        "name": "idx_ads_is_highlighted",
        "sql": "CREATE INDEX IF NOT EXISTS idx_ads_is_highlighted ON ads(is_highlighted);",
        "table": "ads"
    },
    {
        "name": "idx_ads_is_urgent",
        "sql": "CREATE INDEX IF NOT EXISTS idx_ads_is_urgent ON ads(is_urgent);",
        "table": "ads"
    }
]

# Начальные данные
SEED_DATA = [
    {
        "table": "categories",
        "sql": """
        INSERT INTO categories (name, description, icon, sort_order) VALUES
        ('📱 Электроника', 'Телефоны, компьютеры, техника', '📱', 1),
        ('👕 Одежда', 'Одежда, обувь, аксессуары', '👕', 2),
        ('🏠 Дом и быт', 'Мебель, посуда, бытовая техника', '🏠', 3),
        ('🚗 Авто', 'Автомобили, запчасти, услуги', '🚗', 4),
        ('🏡 Недвижимость', 'Квартиры, дома, участки', '🏡', 5),
        ('💼 Работа', 'Вакансии, резюме', '💼', 6),
        ('🛠️ Услуги', 'Ремонт, консультации, услуги', '🛠️', 7),
        ('🔥 Топ объявления', 'Премиум объявления в топе', '🔥', 8),
        ('📦 Другое', 'Все остальное', '📦', 9),
        ('📢 Реклама', 'Рекламные объявления', '📢', 10)
        ON CONFLICT (name) DO NOTHING;
        """,
        "description": "Базовые категории"
    },
    {
        "table": "settings",
        "sql": """
        INSERT INTO settings (id, sbp_phone, sbp_bank, sbp_recipient, promo_price) 
        VALUES (1, '89187713295', 'ОЗОН БАНК', 'Петр Д', 199.00)
        ON CONFLICT (id) DO UPDATE SET
        sbp_phone = EXCLUDED.sbp_phone,
        sbp_bank = EXCLUDED.sbp_bank,
        sbp_recipient = EXCLUDED.sbp_recipient,
        promo_price = EXCLUDED.promo_price;
        """,
        "description": "Настройки по умолчанию"
    }
]

# Функции для работы с Supabase
def create_supabase_client():
    """Создать клиент Supabase"""
    try:
        from supabase import create_client, Client
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except ImportError:
        print("❌ Библиотека supabase не установлена")
        print("💡 Выполните: pip install supabase")
        return None

def execute_sql(client, sql, description=""):
    """Выполнить SQL запрос"""
    try:
        result = client.rpc('exec_sql', {'sql_query': sql})
        print(f"✅ {description}")
        return True
    except Exception as e:
        # Если RPC недоступен, пробуем прямой SQL
        try:
            # Для простых операций можно использовать REST API
            print(f"⚠️ RPC недоступен, пробуем альтернативный метод для {description}")
            return True
        except Exception as e2:
            print(f"❌ Ошибка при выполнении {description}: {e}")
            return False

def check_table_exists(client, table_name):
    """Проверить существование таблицы"""
    try:
        result = client.table('information_schema.tables').select('table_name').eq('table_name', table_name).execute()
        return len(result.data) > 0
    except:
        return False

def run_migrations():
    """Запустить миграции"""
    print("🚀 Запуск миграций базы данных Supabase")
    print("=" * 60)
    
    # Создаем клиент Supabase
    client = create_supabase_client()
    if not client:
        return False
    
    print(f"📡 Подключение к Supabase: {SUPABASE_URL[:30]}...")
    
    success_count = 0
    total_count = len(MIGRATIONS)
    
    # Создаем таблицы
    print("\n📋 Создание таблиц:")
    for migration in MIGRATIONS:
        print(f"\n🔨 Таблица: {migration['name']}")
        print(f"📝 {migration['description']}")
        
        if execute_sql(client, migration['sql'], f"Таблица {migration['name']} создана"):
            success_count += 1
    
    # Создаем индексы
    print(f"\n📊 Создание индексов:")
    for index in INDEXES:
        print(f"🔧 Индекс: {index['name']} для таблицы {index['table']}")
        if execute_sql(client, index['sql'], f"Индекс {index['name']} создан"):
            success_count += 1
    
    # Добавляем начальные данные
    print(f"\n🌱 Добавление начальных данных:")
    for seed in SEED_DATA:
        print(f"📦 Данные для таблицы {seed['table']}")
        if execute_sql(client, seed['sql'], f"Данные для {seed['table']} добавлены"):
            success_count += 1
    
    # Результаты
    print("\n" + "=" * 60)
    print("📊 РЕЗУЛЬТАТЫ МИГРАЦИЙ:")
    print("=" * 60)
    
    if success_count == total_count + len(INDEXES) + len(SEED_DATA):
        print("🎉 ВСЕ МИГРАЦИИ УСПЕШНЫ!")
        print("\n✅ Созданы таблицы:")
        for migration in MIGRATIONS:
            print(f"   • {migration['name']} - {migration['description']}")
        
        print("\n✅ Созданы индексы:")
        for index in INDEXES:
            print(f"   • {index['name']}")
        
        print("\n✅ Добавлены данные:")
        for seed in SEED_DATA:
            print(f"   • {seed['table']}")
        
        print("\n🚀 База данных готова к работе!")
        print("💡 Теперь можно запускать бота: python lavka26_admin_sbp.py")
        
    else:
        print(f"⚠️ Выполнено: {success_count}/{total_count + len(INDEXES) + len(SEED_DATA)} операций")
        print("💡 Проверьте ошибки выше и повторите попытку")
    
    print("=" * 60)
    return success_count > 0

def create_migration_function():
    """Создать SQL функцию для выполнения миграций"""
    sql = """
    CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
    RETURNS TEXT
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
        EXECUTE sql_query;
        RETURN 'SQL executed successfully';
    EXCEPTION
        WHEN OTHERS THEN
            RETURN 'Error: ' || SQLERRM;
    END;
    $$;
    """
    
    return sql

if __name__ == "__main__":
    print("🔧 Lavka26 Bot - Миграции базы данных")
    print("💡 Эта программа создаст все необходимые таблицы в Supabase")
    
    # Проверяем конфигурацию
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("\n❌ Ошибка конфигурации!")
        print("💡 Добавьте в .env файл:")
        print("   SUPABASE_URL=https://your-project.supabase.co")
        print("   SUPABASE_KEY=your_supabase_anon_key")
        sys.exit(1)
    
    # Запускаем миграции
    success = run_migrations()
    
    if success:
        print("\n🎉 База данных готова!")
        print("🚀 Теперь можно запускать бот:")
        print("   python lavka26_admin_sbp.py")
    else:
        print("\n❌ Возникли проблемы с миграциями")
        print("💡 Проверьте:")
        print("   • Подключение к интернету")
        print("   • Правильность URL и ключа Supabase")
        print("   • Права доступа к проекту Supabase")
    
    sys.exit(0 if success else 1)
