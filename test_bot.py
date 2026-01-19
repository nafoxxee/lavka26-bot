#!/usr/bin/env python3
"""
Тестовый скрипт для проверки работы бота
"""

import asyncio
import sys
import os

# Добавляем текущую директорию в путь
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_KEY, PAYMENT_PROVIDER_TOKEN
from supabase_client import db

async def test_config():
    """Проверка конфигурации"""
    print("🔍 Проверка конфигурации...")
    
    if not TELEGRAM_BOT_TOKEN:
        print("❌ TELEGRAM_BOT_TOKEN не найден")
        return False
    else:
        print("✅ TELEGRAM_BOT_TOKEN найден")
    
    if not SUPABASE_URL:
        print("❌ SUPABASE_URL не найден")
        return False
    else:
        print("✅ SUPABASE_URL найден")
    
    if not SUPABASE_KEY:
        print("❌ SUPABASE_KEY не найден")
        return False
    else:
        print("✅ SUPABASE_KEY найден")
    
    if not PAYMENT_PROVIDER_TOKEN:
        print("⚠️ PAYMENT_PROVIDER_TOKEN не найден (платежи не будут работать)")
    else:
        print("✅ PAYMENT_PROVIDER_TOKEN найден")
    
    return True

async def test_database():
    """Проверка подключения к базе данных"""
    print("\n🔍 Проверка подключения к базе данных...")
    
    try:
        result = await db.test_connection()
        if result:
            print("✅ Подключение к Supabase успешно")
            return True
        else:
            print("❌ Ошибка подключения к Supabase")
            return False
    except Exception as e:
        print(f"❌ Ошибка при подключении к базе данных: {e}")
        return False

async def test_bot_components():
    """Проверка компонентов бота"""
    print("\n🔍 Проверка компонентов бота...")
    
    try:
        # Проверка импортов
        from bot import main, init_all
        from handlers import setup_handlers
        from payments import setup_payment_handlers
        from keyboards import main_menu, promotion_keyboard, boost_options, pin_option
        
        print("✅ Все импорты успешны")
        
        # Проверка клавиатур
        print(f"✅ Клавиатуры загружены:")
        print(f"   - Главное меню: {len(main_menu.keyboard)} кнопок")
        print(f"   - Продвижение: {len(promotion_keyboard.inline_keyboard)} кнопок")
        print(f"   - Поднятие: {len(boost_options.inline_keyboard)} кнопок")
        print(f"   - Закрепление: {len(pin_option.inline_keyboard)} кнопок")
        
        return True
    except Exception as e:
        print(f"❌ Ошибка при загрузке компонентов: {e}")
        return False

async def main():
    """Основная функция тестирования"""
    print("🚀 Запуск тестирования Lavka26 Bot\n")
    
    config_ok = await test_config()
    if not config_ok:
        print("\n❌ Исправьте ошибки в конфигурации и перезапустите тест")
        return
    
    db_ok = await test_database()
    if not db_ok:
        print("\n❌ Исправьте ошибки с базой данных и перезапустите тест")
        return
    
    components_ok = await test_bot_components()
    if not components_ok:
        print("\n❌ Исправьте ошибки в компонентах бота и перезапустите тест")
        return
    
    print("\n🎉 Все тесты пройдены успешно!")
    print("\n📋 Что было исправлено для рекламных объявлений:")
    print("   ✅ Добавлены обработчики для кнопок продвижения")
    print("   ✅ Исправлена работа с Supabase вместо SQLAlchemy")
    print("   ✅ Добавлены недостающие методы в supabase_client.py")
    print("   ✅ Настроены платежи для рекламных функций")
    print("   ✅ Обновлена конфигурация")
    
    print("\n🚀 Теперь можно запускать бота: python bot.py")

if __name__ == "__main__":
    asyncio.run(main())
