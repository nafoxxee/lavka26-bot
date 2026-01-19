#!/usr/bin/env python3
"""
Финальный запуск бота Lavka26 с полной проверкой
"""

import sys
import os
import importlib

def check_and_install_package(package_name, import_name=None):
    """Проверить и установить пакет"""
    if import_name is None:
        import_name = package_name.replace('-', '_')
    
    try:
        importlib.import_module(import_name)
        print(f"✅ {package_name} уже установлен")
        return True
    except ImportError:
        print(f"📥 Установка {package_name}...")
        try:
            import subprocess
            subprocess.check_call([sys.executable, "-m", "pip", "install", package_name])
            print(f"✅ {package_name} установлен")
            return True
        except:
            print(f"❌ Ошибка установки {package_name}")
            return False

def check_files():
    """Проверка необходимых файлов"""
    required_files = [
        '.env',
        'lavka26_admin_sbp.py',
        'payment_requisites.json'
    ]
    
    missing = []
    for file in required_files:
        if not os.path.exists(file):
            missing.append(file)
    
    if missing:
        print(f"❌ Отсутствуют файлы: {', '.join(missing)}")
        return False
    
    print("✅ Все необходимые файлы на месте")
    return True

def load_env():
    """Загрузка переменных окружения"""
    try:
        with open('.env', 'r') as f:
            content = f.read()
        
        required_vars = ['TELEGRAM_BOT_TOKEN', 'SUPABASE_URL', 'SUPABASE_KEY', 'ADMIN_ID']
        
        for var in required_vars:
            if var not in content:
                print(f"❌ Отсутствует переменная {var} в .env")
                return False
        
        print("✅ Переменные окружения настроены")
        return True
    except Exception as e:
        print(f"❌ Ошибка загрузки .env: {e}")
        return False

def launch_bot():
    """Запуск бота"""
    print("\n🚀 Запуск бота Lavka26...")
    
    try:
        # Устанавливаем переменные окружения
        os.environ.setdefault('PYTHONPATH', os.path.dirname(os.path.abspath(__file__)))
        
        # Импортируем и запускаем бота
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        
        import lavka26_admin_sbp
        lavka26_admin_sbp.main()
        
    except KeyboardInterrupt:
        print("\n👋 Бот остановлен")
    except Exception as e:
        print(f"❌ Ошибка запуска бота: {e}")
        print("\n💡 Проверьте:")
        print("   • Токен бота в .env")
        print("   • Доступность Supabase")
        print("   • Установленные зависимости")

def main():
    print("🔧 Lavka26 Bot - Финальный запуск")
    print("=" * 50)
    
    # Проверяем файлы
    if not check_files():
        input("\nНажмите Enter для выхода...")
        return
    
    # Проверяем .env
    if not load_env():
        input("\nНажмите Enter для выхода...")
        return
    
    # Устанавливаем зависимости
    print("\n📦 Проверка зависимостей...")
    packages = [
        ('python-telegram-bot', 'telegram'),
        ('supabase', 'supabase'),
        ('python-dotenv', 'dotenv')
    ]
    
    all_installed = True
    for package, import_name in packages:
        if not check_and_install_package(package, import_name):
            all_installed = False
    
    if not all_installed:
        print("\n❌ Не все зависимости установлены")
        input("Нажмите Enter для выхода...")
        return
    
    # Запускаем бота
    launch_bot()

if __name__ == "__main__":
    main()
