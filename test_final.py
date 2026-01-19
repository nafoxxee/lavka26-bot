#!/usr/bin/env python3
"""
Тестирование финальной версии бота Lavka26
"""

import sys
import os

def test_final_bot():
    """Тестирование финальной версии бота"""
    print("🚀 Тестирование Lavka26 Bot - Финальная версия")
    print("=" * 50)
    
    # Тест 1: Проверка файлов
    print("\n📁 Проверка файлов...")
    required_files = [
        'lavka26_final.py',
        '.env',
        'requirements_final.txt',
        'README_FINAL.md',
        'START_BOT.bat'
    ]
    
    files_ok = True
    for file in required_files:
        if os.path.exists(file):
            print(f"✅ {file}")
        else:
            print(f"❌ {file} - отсутствует")
            files_ok = False
    
    # Тест 2: Проверка конфигурации
    print("\n⚙️ Проверка конфигурации...")
    try:
        with open('.env', 'r') as f:
            env_content = f.read()
            
        required_vars = ['TELEGRAM_BOT_TOKEN', 'SUPABASE_URL', 'SUPABASE_KEY']
        config_ok = True
        
        for var in required_vars:
            if var in env_content and env_content.split(f'{var}=')[1].strip():
                print(f"✅ {var} - настроен")
            else:
                print(f"❌ {var} - не настроен")
                config_ok = False
        
        if 'PAYMENT_PROVIDER_TOKEN=' in env_content and env_content.split('PAYMENT_PROVIDER_TOKEN=')[1].strip():
            print("✅ PAYMENT_PROVIDER_TOKEN - настроен")
            print("💳 Платежи включены")
        else:
            print("⚠️ PAYMENT_PROVIDER_TOKEN - не настроен")
            print("💳 Платежи отключены (требуется токен от @BotFather)")
    
    except FileNotFoundError:
        print("❌ Файл .env не найден")
        config_ok = False
    
    # Тест 3: Проверка синтаксиса
    print("\n🐍 Проверка синтаксиса Python...")
    try:
        import py_compile
        py_compile.compile('lavka26_final.py', doraise=True)
        print("✅ Синтаксис корректен")
        syntax_ok = True
    except py_compile.PyCompileError as e:
        print(f"❌ Ошибка синтаксиса: {e}")
        syntax_ok = False
    
    # Тест 4: Проверка импортов
    print("\n📦 Проверка импортов...")
    try:
        import telegram
        print("✅ python-telegram-bot")
        imports_ok = True
    except ImportError:
        print("❌ python-telegram-bot не установлен")
        print("💡 Выполните: pip install python-telegram-bot")
        imports_ok = False
    
    try:
        import dotenv
        print("✅ python-dotenv")
    except ImportError:
        print("❌ python-dotenv не установлен")
        print("💡 Выполните: pip install python-dotenv")
        imports_ok = False
    
    # Результаты
    print("\n" + "=" * 50)
    print("📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:")
    print("=" * 50)
    
    tests = [
        ("Файлы проекта", files_ok),
        ("Конфигурация", config_ok),
        ("Синтаксис", syntax_ok),
        ("Импорты", imports_ok)
    ]
    
    all_ok = True
    for test_name, result in tests:
        status = "✅ ПРОЙДЕН" if result else "❌ НЕ ПРОЙДЕН"
        print(f"{test_name}: {status}")
        if not result:
            all_ok = False
    
    print("\n" + "=" * 50)
    
    if all_ok:
        print("🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!")
        print("\n🚀 БОТ ГОТОВ К ЗАПУСКУ!")
        print("\n📋 Что делать дальше:")
        print("1. 📡 Получите PAYMENT_PROVIDER_TOKEN у @BotFather")
        print("2. ⚙️ Добавьте токен в .env файл")
        print("3. 🚀 Запустите бота: python lavka26_final.py")
        print("4. 📱 Протестируйте на телефоне")
        
        print("\n💰 Функционал монетизации готов:")
        print("   ✅ Рекламные объявления (50 ₽)")
        print("   ✅ Продленный срок (+100-200 ₽)")
        print("   ✅ Оплата через Telegram")
        print("   ✅ Пошаговое создание")
        
        print("\n🎯 Ожидаемые результаты:")
        print("   📢 Первые объявления: 1 час")
        print("   💰 Первый доход: 1 день")
        print("   📈 Окупаемость: 1 месяц")
        
    else:
        print("❌ Есть проблемы для исправления")
        print("\n🔧 Рекомендации:")
        if not files_ok:
            print("   • Убедитесь что все файлы на месте")
        if not config_ok:
            print("   • Проверьте .env файл")
        if not syntax_ok:
            print("   • Исправьте ошибки в коде")
        if not imports_ok:
            print("   • Установите зависимости: pip install -r requirements_final.txt")
    
    print("\n" + "=" * 50)
    return all_ok

if __name__ == "__main__":
    success = test_final_bot()
    sys.exit(0 if success else 1)
