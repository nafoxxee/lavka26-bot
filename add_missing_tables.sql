-- Добавление недостающих таблиц и полей для Lavka26 Bot

-- Таблица настроек
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    sbp_phone VARCHAR(20),
    sbp_bank VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Вставляем начальную запись если таблица пуста
INSERT INTO settings (id, sbp_phone, sbp_bank) 
SELECT 1, NULL, NULL 
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE id = 1);

-- Добавляем поля для рекламных объявлений
ALTER TABLE ads 
ADD COLUMN IF NOT EXISTS is_relevant BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_promo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website VARCHAR(500),
ADD COLUMN IF NOT EXISTS location_text VARCHAR(500),
ADD COLUMN IF NOT EXISTS contact VARCHAR(500),
ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb;

-- Обновляем существующие объявления
UPDATE ads SET 
    is_relevant = TRUE,
    is_promo = FALSE,
    videos = '[]'::jsonb
WHERE is_relevant IS NULL OR is_promo IS NULL OR videos IS NULL;

-- Добавляем категорию для рекламных объявлений
INSERT INTO categories (name, emoji, "order") 
SELECT 'Реклама', '📢', 15
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Реклама');

-- Отключаем RLS для таблицы settings (админ должен иметь полный доступ)
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
