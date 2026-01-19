-- Добавление недостающего поля contact в таблицу ads
-- Безопасное добавление поля без изменения существующих данных

ALTER TABLE ads 
ADD COLUMN IF NOT EXISTS contact VARCHAR(500);

-- Проверяем что поле добавлено
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ads' AND column_name = 'contact';
