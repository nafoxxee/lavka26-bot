-- Добавление поля hide_username для таблицы ads
-- Это поле будет определять, скрыт ли username автора в рекламном объявлении

ALTER TABLE ads 
ADD COLUMN hide_username BOOLEAN DEFAULT FALSE;

-- Добавляем индекс для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_ads_hide_username ON ads(hide_username);

-- Проверяем что поле добавлено
SELECT 'Поле hide_username успешно добавлено в таблицу ads' as status;
