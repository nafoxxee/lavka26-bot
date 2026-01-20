-- Lavka26 Supabase Database Schema - Part 2
-- Включение RLS (Row Level Security) и политики

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
