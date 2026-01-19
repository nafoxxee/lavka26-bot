-- Безопасное добавление поля hide_username для таблицы ads
-- Проверяет существование таблицы и поля перед созданием

-- Проверяем существование таблицы ads
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'ads'
    ) THEN
        -- Таблица существует, проверяем поле hide_username
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'ads' 
            AND column_name = 'hide_username'
        ) THEN
            -- Поля не существует, добавляем его
            ALTER TABLE ads 
            ADD COLUMN hide_username BOOLEAN DEFAULT FALSE;
            
            -- Добавляем индекс для оптимизации запросов
            CREATE INDEX IF NOT EXISTS idx_ads_hide_username ON ads(hide_username);
            
            RAISE NOTICE 'Поле hide_username успешно добавлено в таблицу ads';
        ELSE
            RAISE NOTICE 'Поле hide_username уже существует в таблице ads';
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
                    AND column_name = 'hide_username'
                ) THEN 'Поле hide_username добавлено или уже существует'
                ELSE 'Ошибка: поле hide_username не добавлено'
            END
        ELSE 'Ошибка: таблица ads не существует'
    END as status;
