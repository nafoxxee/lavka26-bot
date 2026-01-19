-- Исправление CHECK constraint для таблицы ads

-- Удаляем старый constraint
ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_status_check;

-- Создаем новый constraint с полным списком статусов
ALTER TABLE ads 
ADD CONSTRAINT ads_status_check 
CHECK (status IN ('draft', 'moderation', 'active', 'inactive', 'sold', 'blocked', 'archived', 'payment_pending', 'payment_review', 'published', 'completed', 'cancelled', 'rejected'));

-- Проверяем результат
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'ads'::regclass AND conname = 'ads_status_check';
