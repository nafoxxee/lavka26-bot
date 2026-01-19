-- Безопасное добавление поля contact в таблицу ads
-- Проверяет существование таблицы и поля перед созданием

DO $$
BEGIN
    -- Проверяем существование таблицы ads
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'ads'
    ) THEN
        -- Таблица существует, проверяем поле contact
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'ads' 
            AND column_name = 'contact'
        ) THEN
            -- Поля не существует, добавляем его
            ALTER TABLE ads 
            ADD COLUMN contact TEXT;
            
            RAISE NOTICE 'Поле contact успешно добавлено в таблицу ads';
        ELSE
            RAISE NOTICE 'Поле contact уже существует в таблице ads';
        END IF;
    ELSE
        RAISE NOTICE 'Таблица ads не существует';
    END IF;
END $$;

-- Проверяем результат
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'ads'
        ) THEN
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'ads' 
                    AND column_name = 'contact'
                ) THEN 'Поле contact добавлено или уже существует'
                ELSE 'Ошибка: поле contact не добавлено'
            END
        ELSE 'Ошибка: таблица ads не существует'
    END as status;
