-- Полный безопасный скрипт для инициализации всей схемы базы данных
-- Создает все необходимые таблицы и поля без повреждения существующих данных

-- Создаем расширение для генерации UUID если его нет
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Создаем таблицу пользователей если ее нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
    ) THEN
        RAISE NOTICE 'Таблица users уже существует';
    ELSE
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            telegram_id BIGINT UNIQUE NOT NULL,
            username VARCHAR(255),
            first_name VARCHAR(255),
            last_name VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Таблица users успешно создана';
    END IF;
END $$;

-- Создаем таблицу категорий если ее нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'categories'
    ) THEN
        RAISE NOTICE 'Таблица categories уже существует';
    ELSE
        CREATE TABLE categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Таблица categories успешно создана';
    END IF;
END $$;

-- Создаем таблицу объявлений если ее нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'ads'
    ) THEN
        RAISE NOTICE 'Таблица ads уже существует';
    ELSE
        CREATE TABLE ads (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10,2),
            photos TEXT[], -- Массив фото в формате JSON
            videos TEXT[], -- Массив видео в формате JSON
            website TEXT,
            location JSONB, -- Геолокация в формате JSON
            location_text TEXT, -- Текстовый адрес
            contact TEXT,
            hide_username BOOLEAN DEFAULT FALSE,
            status VARCHAR(50) DEFAULT 'moderation', -- moderation, active, archived
            is_relevant BOOLEAN DEFAULT TRUE,
            is_promo BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Создаем индексы для оптимизации
        CREATE INDEX idx_ads_user_id ON ads(user_id);
        CREATE INDEX idx_ads_category_id ON ads(category_id);
        CREATE INDEX idx_ads_status ON ads(status);
        CREATE INDEX idx_ads_is_promo ON ads(is_promo);
        CREATE INDEX idx_ads_hide_username ON ads(hide_username);
        CREATE INDEX idx_ads_created_at ON ads(created_at);
        
        RAISE NOTICE 'Таблица ads успешно создана со всеми полями';
    END IF;
END $$;

-- Создаем таблицу избранного если ее нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'favorites'
    ) THEN
        RAISE NOTICE 'Таблица favorites уже существует';
    ELSE
        CREATE TABLE favorites (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            ad_id INTEGER REFERENCES ads(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, ad_id) -- Один пользователь может добавить объявление в избранное только один раз
        );
        
        -- Создаем индексы
        CREATE INDEX idx_favorites_user_id ON favorites(user_id);
        CREATE INDEX idx_favorites_ad_id ON favorites(ad_id);
        
        RAISE NOTICE 'Таблица favorites успешно создана';
    END IF;
END $$;

-- Создаем таблицу настроек если ее нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'settings'
    ) THEN
        RAISE NOTICE 'Таблица settings уже существует';
    ELSE
        CREATE TABLE settings (
            id SERIAL PRIMARY KEY,
            sbp_phone TEXT,
            sbp_bank TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Добавляем начальную запись если ее нет
        INSERT INTO settings (id, sbp_phone, sbp_bank) 
        VALUES (1, '+79123456789', 'СберБанк');
        
        RAISE NOTICE 'Таблица settings успешно создана с начальными данными';
    END IF;
END $$;

-- Создаем таблицу чатов если ее нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'chats'
    ) THEN
        RAISE NOTICE 'Таблица chats уже существует';
    ELSE
        CREATE TABLE chats (
            id SERIAL PRIMARY KEY,
            ad_id INTEGER REFERENCES ads(id) ON DELETE CASCADE,
            initiator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            responder_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Создаем индексы
        CREATE INDEX idx_chats_ad_id ON chats(ad_id);
        CREATE INDEX idx_chats_initiator_id ON chats(initiator_id);
        CREATE INDEX idx_chats_responder_id ON chats(responder_id);
        
        RAISE NOTICE 'Таблица chats успешно создана';
    END IF;
END $$;

-- Создаем таблицу платежей если ее нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'payments'
    ) THEN
        RAISE NOTICE 'Таблица payments уже существует';
    ELSE
        CREATE TABLE payments (
            id SERIAL PRIMARY KEY,
            ad_id INTEGER REFERENCES ads(id) ON DELETE CASCADE,
            amount DECIMAL(10,2) NOT NULL,
            status VARCHAR(50) DEFAULT 'completed', -- pending, completed, failed
            payment_method VARCHAR(50), -- sbp, card, etc
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Создаем индексы
        CREATE INDEX idx_payments_ad_id ON payments(ad_id);
        CREATE INDEX idx_payments_status ON payments(status);
        CREATE INDEX idx_payments_created_at ON payments(created_at);
        
        RAISE NOTICE 'Таблица payments успешно создана';
    END IF;
END $$;

-- Проверяем результат
SELECT 
    'Безопасное создание схемы завершено. Все таблицы готовы к использованию.' as status,
    array(
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'categories', 'ads', 'favorites', 'settings', 'chats', 'payments')
        ORDER BY table_name
    ) as created_tables;
