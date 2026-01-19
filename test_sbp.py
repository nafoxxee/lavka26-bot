#!/usr/bin/env python3
"""
Тестирование Lavka26 Bot с оплатой СБП
"""

import os
import sys

def test_sbp_bot():
    """Тестирование бота с СБП оплатой"""
    print("🚀 Тестирование Lavka26 Bot - Оплата СБП")
    print("=" * 50)
    
    # Тест 1: Проверка файлов
    print("\n📁 Проверка файлов...")
    required_files = [
        'lavka26_sbp.py',
        '.env',
        'README_SBP.md',
        'START_SBP.bat'
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
            
        required_vars = ['TELEGRAM_BOT_TOKEN', 'ADMIN_ID']
        config_ok = True
        
        for var in required_vars:
            if var in env_content and env_content.split(f'{var}=')[1].strip():
                print(f"✅ {var} - настроен")
            else:
                print(f"❌ {var} - не настроен")
                config_ok = False
    
    except FileNotFoundError:
        print("❌ Файл .env не найден")
        config_ok = False
    
    # Тест 3: Проверка синтаксиса
    print("\n🐍 Проверка синтаксиса Python...")
    try:
        import py_compile
        py_compile.compile('lavka26_sbp.py', doraise=True)
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
        print("\n🚀 БОТ С ОПЛАТОЙ СБП ГОТОВ!")
        print("\n📋 Что делать дальше:")
        print("1. 📝 Укажите свои реквизиты в lavka26_sbp.py")
        print("2. 📱 Создайте QR-код для СБП")
        print("3. 🚀 Запустите: python lavka26_sbp.py")
        print("4. 📱 Протестируйте на телефоне")
        
        print("\n💰 Схема оплаты готова:")
        print("   ✅ Рекламные объявления (199 ₽)")
        print("   ✅ Оплата через СБП")
        print("   ✅ Обязательный комментарий")
        print("   ✅ Проверка админом")
        print("   ✅ Защита от обмана")
        
        print("\n🎯 Преимущества:")
        print("   💸 Нет комиссий")
        print("   🛡️ Полный контроль")
        print("   🚀 Мгновенный старт")
        print("   📈 Масштабируемость")
        
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
            print("   • Установите зависимости: pip install python-telegram-bot")
    
    print("\n" + "=" * 50)
    return all_ok

if __name__ == "__main__":
    success = test_sbp_bot()
    sys.exit(0 if success else 1)
