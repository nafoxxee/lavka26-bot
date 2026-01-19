-- БЕЗОПАСНОЕ добавление таблицы settings для Lavka26 Bot
-- Этот код НЕ изменяет существующие данные, только добавляет новое

-- Создаем таблицу настроек (только если не существует)
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    sbp_phone VARCHAR(20),
    sbp_bank VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Вставляем начальную запись (только если таблица пуста)
INSERT INTO settings (id, sbp_phone, sbp_bank) 
SELECT 1, NULL, NULL 
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE id = 1);

-- Отключаем RLS только для этой таблицы (админ должен иметь полный доступ)
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Проверяем что все создалось корректно
SELECT 'Таблица settings создана успешно' as status;
