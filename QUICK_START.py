#!/usr/bin/env python3
"""
Быстрый запуск бота Lavka26 с СБП оплатой
"""

import os
import sys
import subprocess

def check_python():
    """Проверяем наличие Python"""
    try:
        import sys
        print(f"✅ Python {sys.version}")
        return True
    except:
        print("❌ Python не найден")
        return False

def install_packages():
    """Устанавливаем необходимые пакеты"""
    packages = ['python-telegram-bot', 'supabase', 'python-dotenv']
    
    print("📦 Установка пакетов...")
    for package in packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package} уже установлен")
        except ImportError:
            print(f"📥 Установка {package}...")
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
            print(f"✅ {package} установлен")

def check_env():
    """Проверяем .env файл"""
    if not os.path.exists('.env'):
        print("❌ Файл .env не найден")
        return False
    
    required_vars = ['TELEGRAM_BOT_TOKEN', 'SUPABASE_URL', 'SUPABASE_KEY', 'ADMIN_ID']
    
    with open('.env', 'r') as f:
        content = f.read()
        
    missing = []
    for var in required_vars:
        if var not in content or content.split(f'{var}=')[1].strip() == '':
            missing.append(var)
    
    if missing:
        print(f"❌ Отсутствуют переменные: {', '.join(missing)}")
        return False
    
    print("✅ Файл .env настроен")
    return True

def create_payment_requisites():
    """Создаем файл реквизитов если его нет"""
    if not os.path.exists('payment_requisites.json'):
        default_requisites = {
            "bank_name": "Сбер",
            "phone": "+79001234567",
            "recipient": "Иван Иванов",
            "card_last_digits": "1234",
            "qr_code_url": "",
            "instructions": "Переведите 199₽ на указанные реквизиты с комментарием Lavka26_{ваш_telegram_id}"
        }
        
        import json
        with open('payment_requisites.json', 'w', encoding='utf-8') as f:
            json.dump(default_requisites, f, ensure_ascii=False, indent=2)
        
        print("✅ Создан файл payment_requisites.json")
        print("⚠️ Отредактируйте его с вашими реальными реквизитами!")
    else:
        print("✅ Файл payment_requisites.json существует")

def start_bot():
    """Запускаем бота"""
    print("\n🚀 Запуск бота Lavka26...")
    
    try:
        import lavka26_admin_sbp
        print("🎉 Бот успешно запущен!")
        print("💡 Откройте Telegram и найдите вашего бота")
    except Exception as e:
        print(f"❌ Ошибка запуска бота: {e}")
        return False
    
    return True

def main():
    print("🔧 Быстрый запуск Lavka26 Bot")
    print("=" * 50)
    
    # Проверяем Python
    if not check_python():
        input("Нажмите Enter для выхода...")
        return
    
    # Устанавливаем пакеты
    try:
        install_packages()
        print("✅ Все пакеты установлены")
    except Exception as e:
        print(f"❌ Ошибка установки пакетов: {e}")
        input("Нажмите Enter для выхода...")
        return
    
    # Проверяем .env
    if not check_env():
        print("\n💡 Создайте .env файл с переменными:")
        print("   TELEGRAM_BOT_TOKEN=ваш_токен")
        print("   SUPABASE_URL=https://ваш-проект.supabase.co")
        print("   SUPABASE_KEY=ваш_ключ")
        print("   ADMIN_ID=ваш_telegram_id")
        print("   CHANNEL_ID=@ваш_канал")
        input("Нажмите Enter для выхода...")
        return
    
    # Создаем реквизиты
    create_payment_requisites()
    
    # Запускаем бота
    if start_bot():
        print("\n🎉 Бот готов к работе!")
        print("📱 Найдите бота в Telegram и начните использование")
    else:
        print("\n❌ Не удалось запустить бота")
    
    input("\nНажмите Enter для выхода...")

if __name__ == "__main__":
    main()
