-- Вставка тестовых данных с правильным JSON синтаксисом
INSERT INTO users (telegram_id, username, first_name, last_name) VALUES
    (12345, 'test_user', 'Test', 'User')
ON CONFLICT (telegram_id) DO NOTHING;

INSERT INTO ads (user_id, title, description, price, category, location, status) VALUES
    (12345, 'iPhone 13 Pro', 'Отличное состояние, без царапин', 45000, 'electronics', 'Москва', 'active'),
    (12345, 'Кроссовки Nike', 'Новые, в коробке, размер 42', 3500, 'clothing', 'Санкт-Петербург', 'active'),
    (12345, 'Стол письменный', 'Деревянный стол, 120x60 см', 2500, 'home', 'Казань', 'active')
ON CONFLICT DO NOTHING;
