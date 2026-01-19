-- Добавление недостающих полей для рекламных объявлений
-- Безопасное добавление полей без изменения существующих данных

-- Добавляем поля для рекламных объявлений
ALTER TABLE ads 
ADD COLUMN IF NOT EXISTS is_relevant BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_promo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website VARCHAR(500),
ADD COLUMN IF NOT EXISTS location_text VARCHAR(500),
ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb;

-- Обновляем существующие объявления
UPDATE ads SET 
    is_relevant = TRUE,
    is_promo = FALSE,
    videos = '[]'::jsonb
WHERE is_relevant IS NULL OR is_promo IS NULL OR videos IS NULL;

-- Проверяем что поля добавлены
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'ads' 
AND column_name IN ('is_relevant', 'is_promo', 'website', 'location_text', 'videos', 'contact')
ORDER BY column_name;
