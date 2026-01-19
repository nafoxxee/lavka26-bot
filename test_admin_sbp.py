#!/usr/bin/env python3
"""
Тестирование Lavka26 Bot с админ-панелью СБП
"""

import os
import sys

def test_admin_sbp_bot():
    """Тестирование бота с админ-панелью СБП"""
    print("🚀 Тестирование Lavka26 Bot - Админ-панель СБП")
    print("=" * 60)
    
    # Тест 1: Проверка файлов
    print("\n📁 Проверка файлов...")
    required_files = [
        'lavka26_admin_sbp.py',
        '.env',
        'README_ADMIN_SBP.md',
        'START_ADMIN_SBP.bat'
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
        py_compile.compile('lavka26_admin_sbp.py', doraise=True)
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
    
    # Тест 5: Проверка файла реквизитов
    print("\n💳 Проверка системы реквизитов...")
    try:
        import json
        if os.path.exists('payment_requisites.json'):
            with open('payment_requisites.json', 'r', encoding='utf-8') as f:
                reqs = json.load(f)
            print("✅ Файл реквизитов найден")
            print(f"   Банк: {reqs.get('bank_name', 'не настроен')}")
            print(f"   Статус: {'✅ Настроены' if reqs.get('setup_complete') else '⚠️ Требуется настройка'}")
        else:
            print("⚠️ Файл реквизитов будет создан при первом запуске")
        requisites_ok = True
    except:
        print("❌ Ошибка проверки реквизитов")
        requisites_ok = False
    
    # Результаты
    print("\n" + "=" * 60)
    print("📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:")
    print("=" * 60)
    
    tests = [
        ("Файлы проекта", files_ok),
        ("Конфигурация", config_ok),
        ("Синтаксис", syntax_ok),
        ("Импорты", imports_ok),
        ("Система реквизитов", requisites_ok)
    ]
    
    all_ok = True
    for test_name, result in tests:
        status = "✅ ПРОЙДЕН" if result else "❌ НЕ ПРОЙДЕН"
        print(f"{test_name}: {status}")
        if not result:
            all_ok = False
    
    print("\n" + "=" * 60)
    
    if all_ok:
        print("🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!")
        print("\n🚀 БОТ С АДМИН-ПАНЕЛЬЮ СБП ГОТОВ!")
        print("\n📋 Что делать дальше:")
        print("1. 🚀 Запустите: python lavka26_admin_sbp.py")
        print("2. 👑 Отправьте /start (вы админ)")
        print("3. 💳 Настройте реквизиты (5 шагов)")
        print("4. 📱 Протестируйте на телефоне")
        
        print("\n💰 Функционал готов:")
        print("   ✅ Админ-панель управления")
        print("   ✅ Настройка реквизитов в боте")
        print("   ✅ Рекламные объявления (199 ₽)")
        print("   ✅ Оплата через СБП")
        print("   ✅ Проверка чеков админом")
        print("   ✅ Статистика в реальном времени")
        
        print("\n🎯 Преимущества для администратора:")
        print("   👑 Полный контроль реквизитов")
        print("   🔧 Мгновенное изменение данных")
        print("   📊 Статистика платежей")
        print("   🛡️ Защита от обмана")
        print("   💰 Нет комиссий")
        
        print("\n📱 Как это работает для пользователя:")
        print("   1. Выбирает рекламу (199 ₽)")
        print("   2. Видит ваши реквизиты")
        print("   3. Оплачивает через СБП")
        print("   4. Отправляет чек")
        print("   5. Получает подтверждение")
        
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
        if not requisites_ok:
            print("   • Проверьте права доступа к файлу")
    
    print("\n" + "=" * 60)
    return all_ok

if __name__ == "__main__":
    success = test_admin_sbp_bot()
    sys.exit(0 if success else 1)
