#!/usr/bin/env python3
"""
Тест миграции Supabase
"""

import os
import sys

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

def main():
    print("🔧 Тест миграции Supabase")
    print("=" * 40)
    
    config = load_config()
    if not config:
        sys.exit(1)
    
    SUPABASE_URL = config.get('SUPABASE_URL', '')
    SUPABASE_KEY = config.get('SUPABASE_KEY', '')
    
    print(f"📡 Supabase URL: {SUPABASE_URL[:30]}...")
    print(f"🔑 Supabase Key: {SUPABASE_KEY[:20]}...")
    
    # Проверяем установку библиотек
    try:
        import supabase
        print("✅ Библиотека supabase установлена")
    except ImportError:
        print("❌ Библиотека supabase не установлена")
        print("💡 Выполните: pip install supabase")
        sys.exit(1)
    
    # Пробуем подключиться
    try:
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Подключение к Supabase успешно")
        
        # Проверяем базовую операцию
        result = client.table('information_schema.tables').select('table_name').limit(1).execute()
        print("✅ Базовый запрос выполнен успешно")
        
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
        sys.exit(1)
    
    print("\n🎉 Все проверки пройдены!")
    print("💡 Теперь можно запускать полную миграцию")

if __name__ == "__main__":
    main()
