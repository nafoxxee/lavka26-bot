import sys
import os

print("Проверка импортов...")

try:
    from config import TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_KEY
    print("✅ Конфигурация загружена")
except Exception as e:
    print(f"❌ Ошибка конфигурации: {e}")
    sys.exit(1)

try:
    from supabase_client import db
    print("✅ Supabase клиент загружен")
except Exception as e:
    print(f"❌ Ошибка Supabase клиента: {e}")
    sys.exit(1)

try:
    from keyboards import main_menu, promotion_keyboard, boost_options, pin_option
    print("✅ Клавиатуры загружены")
except Exception as e:
    print(f"❌ Ошибка клавиатур: {e}")
    sys.exit(1)

try:
    from handlers import setup_handlers, handle_promotion
    print("✅ Обработчики загружены")
except Exception as e:
    print(f"❌ Ошибка обработчиков: {e}")
    sys.exit(1)

try:
    from payments import setup_payment_handlers
    print("✅ Платежи загружены")
except Exception as e:
    print(f"❌ Ошибка платежей: {e}")
    sys.exit(1)

print("\n🎉 Все компоненты успешно загружены!")
print("✅ Рекламные объявления теперь должны работать")
print("\nДля запуска бота выполните: python bot.py")
