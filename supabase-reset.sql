-- Lavka26 Supabase Database Schema - Complete Reset
-- Полная очистка базы данных

-- 1. Удаление всех таблиц (CASCADE)
DROP TABLE IF EXISTS ad_views CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS ads CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Удаление всех индексов
DROP INDEX IF EXISTS idx_users_telegram_id;
DROP INDEX IF EXISTS idx_ads_user_id;
DROP INDEX IF EXISTS idx_ads_category;
DROP INDEX IF EXISTS idx_ads_status;
DROP INDEX IF EXISTS idx_ads_created_at;
DROP INDEX IF EXISTS idx_ads_price;
DROP INDEX IF EXISTS idx_favorites_user_id;
DROP INDEX IF EXISTS idx_favorites_ad_id;
DROP INDEX IF EXISTS idx_chats_ad_id;
DROP INDEX IF EXISTS idx_chats_buyer_id;
DROP INDEX IF EXISTS idx_chats_seller_id;
DROP INDEX IF EXISTS idx_messages_chat_id;
DROP INDEX IF EXISTS idx_messages_sender_id;
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_ad_views_ad_id;
DROP INDEX IF EXISTS idx_ad_views_viewed_at;

-- 3. Удаление всех функций
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 4. Удаление всех триггеров
DROP TRIGGER IF EXISTS update_users_updated_at ON users CASCADE;
DROP TRIGGER IF EXISTS update_ads_updated_at ON ads CASCADE;

-- 5. Удаление всех RLS политик
DROP POLICY IF EXISTS "Users can view own profile" ON users CASCADE;
DROP POLICY IF EXISTS "Users can update own profile" ON users CASCADE;
DROP POLICY IF EXISTS "Users can insert own profile" ON users CASCADE;
DROP POLICY IF EXISTS "Anyone can view active ads" ON ads CASCADE;
DROP POLICY IF EXISTS "Users can manage own ads" ON ads CASCADE;
DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites CASCADE;
DROP POLICY IF EXISTS "Chat participants can view own chats" ON chats CASCADE;
DROP POLICY IF EXISTS "Chat participants can manage own chats" ON chats CASCADE;
DROP POLICY IF EXISTS "Chat participants can view messages" ON messages CASCADE;
DROP POLICY IF EXISTS "Chat participants can insert messages" ON messages CASCADE;
DROP POLICY IF EXISTS "Anyone can track ad views" ON ad_views CASCADE;

-- 6. Отключение RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE ads DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE ad_views DISABLE ROW LEVEL SECURITY;

-- 7. Сообщение об очистке
DO $$
BEGIN
    RAISE NOTICE 'Lavka26 database reset completed - all tables, indexes, policies, functions and triggers have been removed';
END;
$$;
