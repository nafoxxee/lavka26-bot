#!/usr/bin/env python3
"""
Проверка ID пользователей в базе данных
"""

import os
from supabase import create_client
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

def check_user_ids():
    """Проверка ID пользователей"""
    print("🔍 Проверка ID пользователей в базе данных...")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Отсутствуют переменные окружения SUPABASE_URL или SUPABASE_KEY")
        return False
    
    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Получаем всех пользователей
        result = client.table('users').select('*').execute()
        
        if not result.data:
            print("❌ Пользователи не найдены")
            return False
        
        print("📋 Список пользователей:")
        print("-" * 80)
        print(f"{'ID':<5} {'Telegram ID':<15} {'Username':<20} {'First Name':<20}")
        print("-" * 80)
        
        for user in result.data:
            print(f"{user['id']:<5} {user.get('telegram_id', 'N/A'):<15} {user.get('username', 'N/A')[:20]:<20} {user.get('first_name', 'N/A')[:20]:<20}")
        
        print("-" * 80)
        
        # Получаем объявления
        ads_result = client.table('ads').select('id, user_id, title').execute()
        
        if ads_result.data:
            print("\n📄 Объявления и их пользователи:")
            print("-" * 80)
            print(f"{'Ad ID':<7} {'User ID':<8} {'Title':<50}")
            print("-" * 80)
            
            for ad in ads_result.data:
                print(f"{ad['id']:<7} {ad['user_id']:<8} {ad['title'][:50]:<50}")
            
            print("-" * 80)
        
        return True
            
    except Exception as e:
        print(f"❌ Ошибка при проверке ID: {e}")
        return False

if __name__ == "__main__":
    success = check_user_ids()
    if success:
        print("\n🎉 Проверка завершена!")
    else:
        print("\n💥 Ошибка проверки")
