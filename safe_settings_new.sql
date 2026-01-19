-- Безопасное создание таблицы settings с проверкой существования
-- Не затрагивает существующие данные

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'settings'
    ) THEN
        -- Таблица существует, проверяем наличие колонок
        -- Добавляем колонку sbp_phone если ее нет
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'settings' 
            AND column_name = 'sbp_phone'
        ) THEN
            ALTER TABLE settings ADD COLUMN sbp_phone TEXT;
        END IF;
        
        -- Добавляем колонку sbp_bank если ее нет
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'settings' 
            AND column_name = 'sbp_bank'
        ) THEN
            ALTER TABLE settings ADD COLUMN sbp_bank TEXT;
        END IF;
        
        -- Проверяем наличие записи с id=1
        IF NOT EXISTS (SELECT 1 FROM settings WHERE id = 1) THEN
            INSERT INTO settings (id, sbp_phone, sbp_bank) 
            VALUES (1, '+79123456789', 'СберБанк');
            RAISE NOTICE 'Таблица settings обновлена и добавлена начальная запись';
        ELSE
            RAISE NOTICE 'Таблица settings уже существует и содержит данные';
        END IF;
    ELSE
        -- Таблицы не существует, создаем ее
        CREATE TABLE settings (
            id SERIAL PRIMARY KEY,
            sbp_phone TEXT,
            sbp_bank TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Добавляем начальную запись
        INSERT INTO settings (id, sbp_phone, sbp_bank) 
        VALUES (1, '+79123456789', 'СберБанк');
        
        RAISE NOTICE 'Таблица settings успешно создана с начальными данными';
    END IF;
END $$;

-- Проверяем результат
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'settings'
        ) THEN 'Таблица settings готова к использованию'
        ELSE 'Ошибка: таблица settings не создана'
    END as status;
