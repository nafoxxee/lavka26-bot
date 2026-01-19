#!/usr/bin/env python3
"""
Инициализация настроек бота в Supabase
"""

import os
from supabase import create_client
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

def init_settings():
    """Инициализация настроек бота"""
    print("🔧 Инициализация настроек бота...")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Отсутствуют переменные окружения SUPABASE_URL или SUPABASE_KEY")
        return False
    
    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Проверяем существование настроек
        result = client.table('settings').select('*').eq('id', 1).execute()
        
        if result.data:
            print("✅ Настройки уже существуют")
            print(f"📞 Телефон: {result.data[0].get('sbp_phone', 'не настроен')}")
            print(f"🏦 Банк: {result.data[0].get('sbp_bank', 'не настроен')}")
            return True
        
        # Создаем настройки по умолчанию
        settings_data = {
            'id': 1,
            'sbp_phone': '79123456789',
            'sbp_bank': 'Сбер',
            'sbp_recipient': 'Lavka26',
            'promo_price': 199.00
        }
        
        result = client.table('settings').insert(settings_data).execute()
        
        if result.data:
            print("✅ Настройки успешно созданы:")
            print(f"📞 Телефон: {settings_data['sbp_phone']}")
            print(f"🏦 Банк: {settings_data['sbp_bank']}")
            print(f"👤 Получатель: {settings_data['sbp_recipient']}")
            print(f"💰 Цена рекламы: {settings_data['promo_price']} ₽")
            return True
        else:
            print("❌ Ошибка создания настроек")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка при инициализации настроек: {e}")
        return False

if __name__ == "__main__":
    success = init_settings()
    if success:
        print("\n🎉 Настройки бота успешно инициализированы!")
    else:
        print("\n💥 Ошибка инициализации настроек")
