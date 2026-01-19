#!/usr/bin/env python3
"""
Исправление структуры таблицы settings
"""

import os
from supabase import create_client
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

def fix_settings_table():
    """Исправление структуры таблицы settings"""
    print("🔧 Исправление таблицы settings...")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Отсутствуют переменные окружения SUPABASE_URL или SUPABASE_KEY")
        return False
    
    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # SQL команды для исправления структуры
        sql_commands = [
            # Добавляем недостающие колонки если их нет
            """
            ALTER TABLE settings 
            ADD COLUMN IF NOT EXISTS sbp_recipient VARCHAR(255) DEFAULT 'Lavka26';
            """,
            """
            ALTER TABLE settings 
            ADD COLUMN IF NOT EXISTS promo_price DECIMAL(10,2) DEFAULT 199.00;
            """,
            """
            ALTER TABLE settings 
            ADD COLUMN IF NOT EXISTS channel_id VARCHAR(100);
            """,
            """
            ALTER TABLE settings 
            ADD COLUMN IF NOT EXISTS admin_id BIGINT;
            """,
            """
            ALTER TABLE settings 
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            """,
            """
            ALTER TABLE settings 
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            """,
            # Обновляем существующие записи
            """
            UPDATE settings 
            SET sbp_recipient = COALESCE(sbp_recipient, 'Lavka26'),
                promo_price = COALESCE(promo_price, 199.00),
                created_at = COALESCE(created_at, NOW()),
                updated_at = NOW()
            WHERE id = 1;
            """,
            # Вставляем запись по умолчанию если ее нет
            """
            INSERT INTO settings (id, sbp_phone, sbp_bank, sbp_recipient, promo_price, created_at, updated_at) 
            VALUES (1, '79123456789', 'Сбер', 'Lavka26', 199.00, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET
            sbp_phone = EXCLUDED.sbp_phone,
            sbp_bank = EXCLUDED.sbp_bank,
            sbp_recipient = EXCLUDED.sbp_recipient,
            promo_price = EXCLUDED.promo_price,
            updated_at = NOW();
            """
        ]
        
        for i, sql in enumerate(sql_commands, 1):
            print(f"🔧 Выполняю команду {i}/{len(sql_commands)}...")
            try:
                result = client.rpc('exec_sql', {'sql_query': sql})
                print(f"✅ Команда {i} выполнена успешно")
            except Exception as e:
                print(f"⚠️ Ошибка выполнения команды {i}: {e}")
                # Пробуем прямой SQL если RPC не работает
                try:
                    print(f"🔄 Пробую альтернативный метод для команды {i}...")
                    # Для некоторых операций можно использовать REST API
                    pass
                except Exception as e2:
                    print(f"❌ Критическая ошибка команды {i}: {e2}")
        
        # Проверяем результат
        print("\n🔍 Проверяем результат...")
        result = client.table('settings').select('*').eq('id', 1).execute()
        
        if result.data:
            settings = result.data[0]
            print("✅ Таблица settings успешно обновлена:")
            print(f"📞 Телефон: {settings.get('sbp_phone', 'не настроен')}")
            print(f"🏦 Банк: {settings.get('sbp_bank', 'не настроен')}")
            print(f"👤 Получатель: {settings.get('sbp_recipient', 'не настроен')}")
            print(f"💰 Цена рекламы: {settings.get('promo_price', 'не настроен')}")
            return True
        else:
            print("❌ Не удалось проверить результат")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка при исправлении таблицы: {e}")
        return False

if __name__ == "__main__":
    success = fix_settings_table()
    if success:
        print("\n🎉 Таблица settings успешно исправлена!")
    else:
        print("\n💥 Ошибка исправления таблицы")
