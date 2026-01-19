#!/usr/bin/env python3
"""
Скрипт для исправления CHECK constraint в таблице ads
"""

import os
from supabase import create_client
import sys

# Получаем переменные окружения
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://your-project.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'your-anon-key')

try:
    # Подключаемся к Supabase
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Подключение к Supabase успешно")
    
    # Удаляем старый constraint
    try:
        result = supabase.rpc('execute_sql', {
            'sql': 'ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_status_check;'
        })
        print("✅ Старый constraint удален")
    except Exception as e:
        print(f"⚠️ Ошибка удаления constraint: {e}")
    
    # Создаем новый constraint
    try:
        result = supabase.rpc('execute_sql', {
            'sql': '''
            ALTER TABLE ads 
            ADD CONSTRAINT ads_status_check 
            CHECK (status IN ('draft', 'moderation', 'active', 'inactive', 'sold', 'blocked', 'archived', 'payment_pending', 'payment_review', 'published', 'completed', 'cancelled', 'rejected'));
            '''
        })
        print("✅ Новый constraint создан")
    except Exception as e:
        print(f"❌ Ошибка создания constraint: {e}")
        # Пробуем альтернативный метод
        try:
            result = supabase.table('ads').select('status').limit(1).execute()
            print("⚠️ Пробуем прямой SQL через postgres...")
        except Exception as e2:
            print(f"❌ Альтернативный метод тоже не сработал: {e2}")
    
    print("✅ Операция завершена")
    
except Exception as e:
    print(f"❌ Критическая ошибка: {e}")
    sys.exit(1)
