-- Lavka26 Supabase Database Schema - Manual Creation
-- Создавайте таблицы по одной

-- 1. Таблица пользователей
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    photo_url TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    bio TEXT,
    location VARCHAR(255),
    rating DECIMAL(3,2) DEFAULT 0.0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Таблица объявлений
CREATE TABLE ads (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    condition VARCHAR(20) DEFAULT 'new',
    images TEXT DEFAULT '[]',
    location VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    views INTEGER DEFAULT 0,
    favorites_count INTEGER DEFAULT 0,
    is_negotiable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Таблица избранных
CREATE TABLE favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
    ad_id BIGINT REFERENCES ads(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, ad_id)
);

-- 4. Таблица чатов
CREATE TABLE chats (
    id BIGSERIAL PRIMARY KEY,
    ad_id BIGINT REFERENCES ads(id) ON DELETE CASCADE,
    buyer_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
    seller_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ad_id, buyer_id, seller_id)
);

-- 5. Таблица сообщений
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT REFERENCES chats(id) ON DELETE CASCADE,
    sender_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Таблица просмотров
CREATE TABLE ad_views (
    id BIGSERIAL PRIMARY KEY,
    ad_id BIGINT REFERENCES ads(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(telegram_id) ON DELETE SET NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Вставка тестовых данных
INSERT INTO users (telegram_id, username, first_name, last_name) VALUES
    (12345, 'test_user', 'Test', 'User')
ON CONFLICT (telegram_id) DO NOTHING;

INSERT INTO ads (user_id, title, description, price, category, location, status) VALUES
    (12345, 'iPhone 13 Pro', 'Отличное состояние, без царапин', 45000, 'electronics', 'Москва', 'active'),
    (12345, 'Кроссовки Nike', 'Новые, в коробке, размер 42', 3500, 'clothing', 'Санкт-Петербург', 'active'),
    (12345, 'Стол письменный', 'Деревянный стол, 120x60 см', 2500, 'home', 'Казань', 'active')
ON CONFLICT DO NOTHING;
