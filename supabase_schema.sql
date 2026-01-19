-- Schema для Lavka26 Bot в Supabase

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица категорий
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    emoji VARCHAR(10),
    parent_id INTEGER REFERENCES categories(id),
    "order" INTEGER DEFAULT 0
);

-- Таблица объявлений
CREATE TABLE IF NOT EXISTS ads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    photos JSONB DEFAULT '[]'::jsonb,
    location JSONB,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'moderation', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Поля для продвижения
    is_pinned BOOLEAN DEFAULT FALSE,
    pin_until TIMESTAMP WITH TIME ZONE,
    is_boosted BOOLEAN DEFAULT FALSE,
    boost_until TIMESTAMP WITH TIME ZONE
);

-- Таблица избранного
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ad_id INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, ad_id)
);

-- Таблица чатов
CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    ad_id INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    initiator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    responder_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица сообщений
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT,
    photo VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица платежей
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('ad_creation', 'boost_day', 'boost_week', 'pin_month')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    telegram_payment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_ads_user_id ON ads(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_category_id ON ads(category_id);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_created_at ON ads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_ad_id ON favorites(ad_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- Полнотекстовый поиск для объявлений
CREATE OR REPLACE FUNCTION search_ads(search_query TEXT)
RETURNS TABLE (
    id INTEGER,
    user_id INTEGER,
    category_id INTEGER,
    title VARCHAR(255),
    description TEXT,
    price DECIMAL(10,2),
    photos JSONB,
    location JSONB,
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    is_pinned BOOLEAN,
    pin_until TIMESTAMP WITH TIME ZONE,
    is_boosted BOOLEAN,
    boost_until TIMESTAMP WITH TIME ZONE,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ads.*,
        ts_rank_cd(
            to_tsvector('russian', COALESCE(ads.title, '') || ' ' || COALESCE(ads.description, '')),
            plainto_tsquery('russian', search_query)
        ) as rank
    FROM ads
    WHERE 
        ads.status = 'active'
        AND (
            to_tsvector('russian', COALESCE(ads.title, '')) @@ plainto_tsquery('russian', search_query)
            OR to_tsvector('russian', COALESCE(ads.description, '')) @@ plainto_tsquery('russian', search_query)
        )
    ORDER BY rank DESC, ads.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ads_updated_at
    BEFORE UPDATE ON ads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) политики
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Политика для пользователей (могут видеть только свои данные)
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (telegram_id = current_setting('app.current_user_id')::BIGINT);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (telegram_id = current_setting('app.current_user_id')::BIGINT);

-- Политика для объявлений
CREATE POLICY "Anyone can view active ads" ON ads
    FOR SELECT USING (status = 'active');

CREATE POLICY "Users can manage own ads" ON ads
    FOR ALL USING (user_id = (
        SELECT id FROM users WHERE telegram_id = current_setting('app.current_user_id')::BIGINT
    ));

-- Политика для избранного
CREATE POLICY "Users can manage own favorites" ON favorites
    FOR ALL USING (user_id = (
        SELECT id FROM users WHERE telegram_id = current_setting('app.current_user_id')::BIGINT
    ));

-- Политика для платежей
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (user_id = (
        SELECT id FROM users WHERE telegram_id = current_setting('app.current_user_id')::BIGINT
    ));
