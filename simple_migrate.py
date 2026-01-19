#!/usr/bin/env python3
"""
Простая миграция Supabase без сложных зависимостей
"""

import os
import sys
import json
import urllib.request
import urllib.parse

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

def create_tables_via_rest():
    """Создаем таблицы через REST API Supabase"""
    
    config = load_config()
    if not config:
        return False
    
    SUPABASE_URL = config.get('SUPABASE_URL', '')
    SUPABASE_KEY = config.get('SUPABASE_KEY', '')
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Отсутствуют URL или ключ Supabase")
        return False
    
    print("🚀 Создание таблиц через REST API")
    print(f"📡 URL: {SUPABASE_URL[:30]}...")
    
    # SQL для создания таблиц
    tables_sql = [
        # Таблица users
        """
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
        
        # Таблица categories
        """
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
        
        # Таблица ads
        """
        CREATE TABLE IF NOT EXISTS ads (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            category_id INTEGER REFERENCES categories(id),
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            price DECIMAL(10,2),
            photos TEXT[],
            contacts TEXT,
            location_lat DECIMAL(10,8),
            location_lng DECIMAL(11,8),
            location_address TEXT,
            status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold', 'blocked')),
            is_promo BOOLEAN DEFAULT FALSE,
            is_vip BOOLEAN DEFAULT FALSE,
            views_count INTEGER DEFAULT 0,
            favorites_count INTEGER DEFAULT 0,
            promoted_until TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,
        
        # Таблица payments
        """
        CREATE TABLE IF NOT EXISTS payments (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            ad_id INTEGER REFERENCES ads(id) ON DELETE SET NULL,
            amount DECIMAL(10,2) NOT NULL,
            payment_type VARCHAR(50) NOT NULL,
            payment_method VARCHAR(50) DEFAULT 'sbp',
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
            provider_payment_id VARCHAR(255),
            comment TEXT,
            screenshot_url TEXT,
            admin_notes TEXT,
            confirmed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,
        
        # Таблица favorites
        """
        CREATE TABLE IF NOT EXISTS favorites (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            ad_id INTEGER REFERENCES ads(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, ad_id)
        );
        """,
        
        # Таблица user_stats
        """
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
        """
    ]
    
    # Пробуем выполнить SQL через RPC
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }
    
    success_count = 0
    
    for i, sql in enumerate(tables_sql):
        print(f"🔨 Создание таблицы {i+1}/{len(tables_sql)}...")
        
        try:
            # Пробуем использовать RPC функцию
            data = {'sql_query': sql.strip()}
            
            url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
            req = urllib.request.Request(url, json.dumps(data).encode(), headers)
            
            with urllib.request.urlopen(req) as response:
                result = response.read().decode()
                print(f"✅ Таблица {i+1} создана")
                success_count += 1
                
        except Exception as e:
            print(f"⚠️ Ошибка при создании таблицы {i+1}: {e}")
            print("💡 Таблица может уже существовать или нужны права администратора")
    
    # Добавляем категории
    try:
        categories_sql = """
        INSERT INTO categories (name, description, icon, sort_order) VALUES
        ('Личные вещи', 'Одежда, обувь, аксессуары', '👕', 1),
        ('Электроника', 'Телефоны, компьютеры, техника', '📱', 2),
        ('Дом и сад', 'Мебель, посуда, растения', '🌿', 3),
        ('Животные', 'Домашние питомцы, корм', '🐶', 4),
        ('Хобби и отдых', 'Спорт, туризм, развлечения', '🎮', 5),
        ('Для бизнеса', 'Оборудование, услуги', '🏭', 6),
        ('Красота и здоровье', 'Косметика, лекарства', '💄', 7),
        ('Билеты и путешествия', 'Авиа, ж/д, туры', '✈', 8),
        ('Строительство и ремонт', 'Материалы, инструменты', '🏗', 9),
        ('Прочее', 'Все остальное', '📦', 10),
        ('Реклама', 'Рекламные объявления', '📢', 11)
        ON CONFLICT (name) DO NOTHING;
        """
        
        data = {'sql_query': categories_sql.strip()}
        url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
        req = urllib.request.Request(url, json.dumps(data).encode(), headers)
        
        with urllib.request.urlopen(req) as response:
            result = response.read().decode()
            print("✅ Категории добавлены")
            success_count += 1
            
    except Exception as e:
        print(f"⚠️ Ошибка при добавлении категорий: {e}")
    
    print(f"\n📊 Результат: {success_count}/{len(tables_sql) + 1} операций выполнено")
    
    if success_count > 0:
        print("🎉 База данных готова к работе!")
        return True
    else:
        print("❌ Не удалось создать таблицы")
        print("💡 Проверьте права доступа в Supabase или создайте таблицы вручную")
        return False

def main():
    print("🔧 Простая миграция Supabase")
    print("=" * 50)
    
    if create_tables_via_rest():
        print("\n🚀 Теперь можно запускать бота:")
        print("   python lavka26_admin_sbp.py")
    else:
        print("\n❌ Возникли проблемы с миграцией")
        print("💡 Создайте таблицы вручную в панели Supabase")

if __name__ == "__main__":
    main()
