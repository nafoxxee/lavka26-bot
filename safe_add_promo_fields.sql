-- Безопасное добавление полей для рекламных объявлений
-- Добавляет поля: website, location_text, is_promo, hide_username

DO $$
BEGIN
    -- Проверяем существование таблицы ads
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'ads'
    ) THEN
        -- Таблица существует, проверяем и добавляем поля
        
        -- Добавляем поле website если его нет
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'ads' 
            AND column_name = 'website'
        ) THEN
            ALTER TABLE ads ADD COLUMN website TEXT;
            RAISE NOTICE 'Поле website добавлено в таблицу ads';
        END IF;
        
        -- Добавляем поле location_text если его нет
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'ads' 
            AND column_name = 'location_text'
        ) THEN
            ALTER TABLE ads ADD COLUMN location_text TEXT;
            RAISE NOTICE 'Поле location_text добавлено в таблицу ads';
        END IF;
        
        -- Добавляем поле is_promo если его нет
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'ads' 
            AND column_name = 'is_promo'
        ) THEN
            ALTER TABLE ads ADD COLUMN is_promo BOOLEAN DEFAULT FALSE;
            RAISE NOTICE 'Поле is_promo добавлено в таблицу ads';
        END IF;
        
        -- Добавляем поле hide_username если его нет
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'ads' 
            AND column_name = 'hide_username'
        ) THEN
            ALTER TABLE ads ADD COLUMN hide_username BOOLEAN DEFAULT FALSE;
            
            -- Добавляем индекс для оптимизации запросов
            CREATE INDEX IF NOT EXISTS idx_ads_hide_username ON ads(hide_username);
            
            RAISE NOTICE 'Поле hide_username добавлено в таблицу ads';
        END IF;
        
        -- Добавляем индекс для is_promo если его нет
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'idx_ads_is_promo'
        ) THEN
            CREATE INDEX idx_ads_is_promo ON ads(is_promo);
            RAISE NOTICE 'Индекс idx_ads_is_promo добавлен';
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
                    AND column_name IN ('website', 'location_text', 'is_promo', 'hide_username')
                ) THEN 'Все поля для рекламных объявлений уже существуют'
                ELSE 'Некоторые поля для рекламных объявлений добавлены'
            END
        ELSE 'Ошибка: таблица ads не существует'
    END as status;
