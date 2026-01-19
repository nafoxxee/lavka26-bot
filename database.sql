-- Lavka26 Схема Базы Данных
-- PostgreSQL с Supabase

-- Включение расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Таблица пользователей
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(20),
    is_admin BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица категорий
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица объявлений
CREATE TABLE ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2),
    images TEXT[], -- Массив URL изображений
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'blocked', 'expired')),
    needs_review BOOLEAN DEFAULT FALSE,
    is_boosted BOOLEAN DEFAULT FALSE,
    boost_expires_at TIMESTAMP WITH TIME ZONE,
    views INTEGER DEFAULT 0,
    location VARCHAR(255),
    contact_info JSONB, -- Дополнительная контактная информация
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица избранного
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, ad_id)
);

-- Таблица чатов
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ad_id, buyer_id, seller_id)
);

-- Таблица сообщений
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    image_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица платежей
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ad_id UUID REFERENCES ads(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RUB',
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('boost_24h', 'boost_72h')),
    telegram_payment_charge_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Таблица очереди модерации
CREATE TABLE moderation_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    moderator_id UUID REFERENCES users(id),
    action VARCHAR(20) CHECK (action IN ('approve', 'reject', 'block')),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Таблица настроек
CREATE TABLE settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Вставка категорий по умолчанию
INSERT INTO categories (name, icon, sort_order) VALUES
('Транспорт', '🚗', 1),
('Недвижимость', '🏠', 2),
('Электроника', '📱', 3),
('Работа', '💼', 4),
('Услуги', '🔧', 5),
('Личные вещи', '👕', 6),
('Хобби', '🎮', 7),
('Животные', '🐕', 8),
('Другое', '📦', 999);

-- Вставка настроек по умолчанию
INSERT INTO settings (key, value) VALUES
('boost_price_24h', '149.00'),
('boost_price_72h', '299.00'),
('max_images_per_ad', '10'),
('max_title_length', '255'),
('max_description_length', '5000'),
('moderation_enabled', 'true'),
('auto_approve_ads', 'false');

-- Индексы для производительности
CREATE INDEX idx_ads_user_id ON ads(user_id);
CREATE INDEX idx_ads_category_id ON ads(category_id);
CREATE INDEX idx_ads_status ON ads(status);
CREATE INDEX idx_ads_is_boosted ON ads(is_boosted);
CREATE INDEX idx_ads_created_at ON ads(created_at DESC);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_ad_id ON favorites(ad_id);
CREATE INDEX idx_chats_ad_id ON chats(ad_id);
CREATE INDEX idx_chats_buyer_id ON chats(buyer_id);
CREATE INDEX idx_chats_seller_id ON chats(seller_id);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Политики безопасности на уровне строк (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Пользователи могут видеть только свои данные
CREATE POLICY "Пользователи могут видеть свой профиль" ON users FOR SELECT USING (auth.uid()::text = telegram_id::text);
CREATE POLICY "Пользователи могут обновлять свой профиль" ON users FOR UPDATE USING (auth.uid()::text = telegram_id::text);

-- Политики видимости объявлений
CREATE POLICY "Все могут видеть активные объявления" ON ads FOR SELECT USING (status = 'active');
CREATE POLICY "Пользователи могут видеть свои объявления" ON ads FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Пользователи могут создавать объявления" ON ads FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Пользователи могут обновлять свои объявления" ON ads FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Пользователи могут удалять свои объявления" ON ads FOR DELETE USING (user_id = auth.uid());

-- Политики для избранного
CREATE POLICY "Пользователи могут управлять своим избранным" ON favorites FOR ALL USING (user_id = auth.uid());

-- Политики для чатов
CREATE POLICY "Пользователи могут видеть свои чаты" ON chats FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "Пользователи могут создавать чаты" ON chats FOR INSERT WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Политики для сообщений
CREATE POLICY "Пользователи могут видеть сообщения в своих чатах" ON messages FOR SELECT USING (
    chat_id IN (
        SELECT id FROM chats WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
);
CREATE POLICY "Пользователи могут отправлять сообщения в своих чатах" ON messages FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    chat_id IN (
        SELECT id FROM chats WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
);

-- Политики для платежей
CREATE POLICY "Пользователи могут видеть свои платежи" ON payments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Пользователи могут создавать платежи" ON payments FOR INSERT WITH CHECK (user_id = auth.uid());

-- Функции
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функция для истечения продвиженных объявлений
CREATE OR REPLACE FUNCTION expire_boosted_ads()
RETURNS void AS $$
BEGIN
    UPDATE ads 
    SET is_boosted = FALSE, boost_expires_at = NULL 
    WHERE is_boosted = TRUE AND boost_expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Функция для получения статистики объявлений
CREATE OR REPLACE FUNCTION get_ad_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_ads', (SELECT COUNT(*) FROM ads WHERE user_id = p_user_id),
        'active_ads', (SELECT COUNT(*) FROM ads WHERE user_id = p_user_id AND status = 'active'),
        'pending_ads', (SELECT COUNT(*) FROM ads WHERE user_id = p_user_id AND status = 'pending'),
        'total_views', (SELECT COALESCE(SUM(views), 0) FROM ads WHERE user_id = p_user_id)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
