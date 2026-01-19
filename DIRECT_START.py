#!/usr/bin/env python3
"""
Прямой запуск бота без проверок
"""

import sys
import os

def main():
    print("🚀 Прямой запуск Lavka26 Bot")
    print("=" * 40)
    
    # Проверяем наличие файла бота
    if not os.path.exists('lavka26_admin_sbp.py'):
        print("❌ Файл lavka26_admin_sbp.py не найден")
        input("Нажмите Enter для выхода...")
        return
    
    # Пробуем запустить бота напрямую
    try:
        print("📥 Импорт модулей...")
        import telegram
        import supabase
        from dotenv import load_dotenv
        print("✅ Модули импортированы")
        
        print("📥 Загрузка конфигурации...")
        load_dotenv()
        print("✅ Конфигурация загружена")
        
        print("📥 Запуск бота...")
        from lavka26_admin_sbp import main
        main()
        
    except ImportError as e:
        print(f"❌ Ошибка импорта: {e}")
        print("💡 Выполните: pip install python-telegram-bot supabase python-dotenv")
        input("Нажмите Enter для выхода...")
        
    except Exception as e:
        print(f"❌ Ошибка запуска: {e}")
        print("💡 Проверьте файл .env и настройки")
        input("Нажмите Enter для выхода...")

if __name__ == "__main__":
    main()
