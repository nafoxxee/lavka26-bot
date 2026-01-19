#!/usr/bin/env python3
"""
Тестовый скрипт для проверки конфигурации Lavka26 Bot
"""

import os
import sys
from dotenv import load_dotenv

def test_config():
    """Проверка конфигурации"""
    print("🔍 Проверка конфигурации Lavka26 Bot...\n")
    
    # Загрузка .env
    load_dotenv()
    
    # Проверка обязательных полей
    required_fields = {
        'TELEGRAM_BOT_TOKEN': 'Токен Telegram бота',
        'SUPABASE_URL': 'URL Supabase проекта',
        'SUPABASE_KEY': 'Ключ Supabase',
        'ADMIN_ID': 'ID администратора'
    }
    
    optional_fields = {
        'PAYMENT_PROVIDER_TOKEN': 'Токен платежей (опционально)',
        'CHANNEL_ID': 'ID канала (опционально)'
    }
    
    all_good = True
    
    print("📋 Обязательные поля:")
    for field, description in required_fields.items():
        value = os.getenv(field)
        if value:
            masked_value = value[:10] + "..." if len(value) > 10 else value
            print(f"  ✅ {field}: {masked_value}")
        else:
            print(f"  ❌ {field}: НЕ НАЙДЕНО - {description}")
            all_good = False
    
    print("\n📋 Опциональные поля:")
    for field, description in optional_fields.items():
        value = os.getenv(field)
        if value:
            masked_value = value[:10] + "..." if len(value) > 10 else value
            print(f"  ✅ {field}: {masked_value}")
        else:
            print(f"  ⚠️  {field}: не указано - {description}")
    
    print("\n🔧 Проверка зависимостей:")
    
    # Проверка Python версии
    python_version = sys.version_info
    if python_version >= (3, 8):
        print(f"  ✅ Python: {python_version.major}.{python_version.minor}.{python_version.micro}")
    else:
        print(f"  ❌ Python: {python_version.major}.{python_version.minor}.{python_version.micro} (требуется 3.8+)")
        all_good = False
    
    # Проверка модулей
    required_modules = [
        'telegram',
        'supabase',
        'dotenv'
    ]
    
    for module in required_modules:
        try:
            __import__(module)
            print(f"  ✅ {module}: установлен")
        except ImportError:
            print(f"  ❌ {module}: НЕ УСТАНОВЛЕН")
            all_good = False
    
    print("\n" + "="*50)
    
    if all_good:
        print("🎉 Конфигурация корректна! Бот готов к запуску.")
        print("\n🚀 Для запуска выполните:")
        print("   python run.py")
    else:
        print("❌ Обнаружены проблемы. Исправьте их перед запуском.")
        print("\n📝 Установите зависимости:")
        print("   pip install -r requirements.txt")
        print("\n🔧 Проверьте .env файл:")
        print("   cp .env.example .env")
        print("   # и отредактируйте .env")
    
    return all_good

def test_supabase_connection():
    """Тест подключения к Supabase"""
    try:
        from supabase_client import db
        import asyncio
        
        print("\n🔗 Тест подключения к Supabase...")
        
        async def test():
            result = await db.test_connection()
            return result
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(test())
        loop.close()
        
        if result:
            print("  ✅ Подключение к Supabase успешно!")
            return True
        else:
            print("  ❌ Ошибка подключения к Supabase")
            return False
            
    except Exception as e:
        print(f"  ❌ Ошибка при тестировании Supabase: {e}")
        return False

if __name__ == '__main__':
    config_ok = test_config()
    
    if config_ok:
        supabase_ok = test_supabase_connection()
        
        if supabase_ok:
            print("\n🎉 Все проверки пройдены! Бот готов к работе!")
        else:
            print("\n⚠️  Проблемы с подключением к Supabase. Проверьте настройки.")
    else:
        print("\n❌ Исправьте проблемы с конфигурацией и повторите проверку.")
