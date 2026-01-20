-- Lavka26 Supabase Database Schema
-- Создание таблиц для маркетплейса

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
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

-- Таблица объявлений
CREATE TABLE IF NOT EXISTS ads (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    condition VARCHAR(20) DEFAULT 'new',
    images JSONB DEFAULT '[]'::jsonb,
    location VARCHAR(255),
    coordinates POINT,
    status VARCHAR(20) DEFAULT 'active',
    views INTEGER DEFAULT 0,
    favorites_count INTEGER DEFAULT 0,
    is_negotiable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица избранных
CREATE TABLE IF NOT EXISTS favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
    ad_id BIGINT REFERENCES ads(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, ad_id)
);

-- Таблица чатов
CREATE TABLE IF NOT EXISTS chats (
    id BIGSERIAL PRIMARY KEY,
    ad_id BIGINT REFERENCES ads(id) ON DELETE CASCADE,
    buyer_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
    seller_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ad_id, buyer_id, seller_id)
);

-- Таблица сообщений
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT REFERENCES chats(id) ON DELETE CASCADE,
    sender_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица просмотров
CREATE TABLE IF NOT EXISTS ad_views (
    id BIGSERIAL PRIMARY KEY,
    ad_id BIGINT REFERENCES ads(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(telegram_id) ON DELETE SET NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_ads_user_id ON ads(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_category ON ads(category);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_created_at ON ads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ads_price ON ads(price);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_ad_id ON favorites(ad_id);
CREATE INDEX IF NOT EXISTS idx_chats_ad_id ON chats(ad_id);
CREATE INDEX IF NOT EXISTS idx_chats_buyer_id ON chats(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chats_seller_id ON chats(seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_views_ad_id ON ad_views(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_views_viewed_at ON ad_views(viewed_at DESC);

-- Включение RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Пользователи могут видеть и редактировать только свои данные
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (telegram_id = auth.jwt() ->> 'telegram_id');

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (telegram_id = auth.jwt() ->> 'telegram_id');

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (telegram_id = auth.jwt() ->> 'telegram_id');

-- Все могут видеть активные объявления
CREATE POLICY "Anyone can view active ads" ON ads
    FOR SELECT USING (status = 'active');

CREATE POLICY "Users can manage own ads" ON ads
    FOR ALL USING (user_id = auth.jwt() ->> 'telegram_id');

-- Избранные видны только владельцу
CREATE POLICY "Users can manage own favorites" ON favorites
    FOR ALL USING (user_id = auth.jwt() ->> 'telegram_id');

-- Чаты видны участникам
CREATE POLICY "Chat participants can view own chats" ON chats
    FOR SELECT USING (buyer_id = auth.jwt() ->> 'telegram_id' OR seller_id = auth.jwt() ->> 'telegram_id');

CREATE POLICY "Chat participants can manage own chats" ON chats
    FOR ALL USING (buyer_id = auth.jwt() ->> 'telegram_id' OR seller_id = auth.jwt() ->> 'telegram_id');

-- Сообщения видны участникам чата
CREATE POLICY "Chat participants can view messages" ON messages
    FOR SELECT USING (
        chat_id IN (
            SELECT id FROM chats 
            WHERE buyer_id = auth.jwt() ->> 'telegram_id' 
            OR seller_id = auth.jwt() ->> 'telegram_id'
        )
    );

CREATE POLICY "Chat participants can insert messages" ON messages
    FOR INSERT WITH CHECK (sender_id = auth.jwt() ->> 'telegram_id');

-- Просмотры объявлений
CREATE POLICY "Anyone can track ad views" ON ad_views
    FOR ALL USING (true);

-- Функция для обновления времени
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для обновления времени
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Вставка тестовых данных (опционально)
INSERT INTO users (telegram_id, username, first_name, last_name) VALUES
    (12345, 'test_user', 'Test', 'User')
ON CONFLICT (telegram_id) DO NOTHING;

INSERT INTO ads (user_id, title, description, price, category, location, status) VALUES
    (12345, 'iPhone 13 Pro', 'Отличное состояние, без царапин', 45000, 'electronics', 'Москва', 'active'),
    (12345, 'Кроссовки Nike', 'Новые, в коробке, размер 42', 3500, 'clothing', 'Санкт-Петербург', 'active'),
    (12345, 'Стол письменный', 'Деревянный стол, 120x60 см', 2500, 'home', 'Казань', 'active')
ON CONFLICT DO NOTHING;
