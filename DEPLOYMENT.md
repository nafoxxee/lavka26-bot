# 🚀 Lavka26 Bot - Развертывание

## 📋 Обзор

Lavka26 Bot - это полноценная система объявлений для Telegram с:
- Node.js ботом на Telegraf
- Базой данных Supabase
- Автоматическим деплоем на Render
- Интеграцией с GitHub

## 🏗️ Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Telegram Bot  │────││   Supabase DB   │────│   GitHub Repo   │
│   (Node.js)     │    ││   (PostgreSQL)  │    │   (Source)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Render App    │    │   Edge Functions│    │   CI/CD Pipeline│
│   (Production)  │    │   (Serverless)  │    │   (Auto Deploy)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Требования

### Локальная разработка
- Node.js 18+
- npm 8+
- Git
- Telegram Bot Token
- Supabase Project

### Продакшн
- Render Account (Free tier)
- GitHub Account
- Supabase Project

## 📦 Установка и запуск

### 1. Клонирование репозитория
```bash
git clone https://github.com/nafoxxee/lavka26-bot.git
cd lavka26-bot
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка переменных окружения
Создайте файл `.env`:
```env
TELEGRAM_BOT_TOKEN=your_bot_token
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
ADMIN_ID=your_telegram_id
CHANNEL_ID=@your_channel
```

### 4. Настройка Supabase
```bash
# Создайте таблицы в Supabase Dashboard
# Или используйте миграции:
npm run migrate
```

### 5. Локальный запуск
```bash
npm start
```

## 🌐 Деплой на Render

### 1. Подключение GitHub
1. Зайдите в Render Dashboard
2. Connect → GitHub Repository
3. Выберите `lavka26-bot`

### 2. Настройка сервиса
```yaml
# render.yaml (уже в репозитории)
services:
  - type: worker
    name: lavka26-bot
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

### 3. Переменные окружения в Render
Добавьте в Render Environment Variables:
- `TELEGRAM_BOT_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `ADMIN_ID`
- `CHANNEL_ID`

### 4. Деплой
```bash
git push origin main
```
Render автоматически соберет и развернет приложение.

## 🗄️ Структура базы данных Supabase

### Таблицы
```sql
-- Пользователи
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Категории
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0
);

-- Объявления
CREATE TABLE ads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    category_id INTEGER REFERENCES categories(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2),
    photos TEXT[],
    status VARCHAR(20) DEFAULT 'moderation',
    is_promo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Настройки
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    sbp_phone VARCHAR(20),
    sbp_bank VARCHAR(255),
    sbp_recipient VARCHAR(255)
);
```

## 💰 Система оплаты

### Процесс оплаты
1. Пользователь создает рекламное объявление
2. Админ одобряет объявление
3. Пользователь получает уведомление об оплате
4. Пользователь оплачивает через СБП (199 ₽)
5. Пользователь отправляет скриншот чека
6. Админ подтверждает оплату
7. Объявление публикуется в канале

### Реквизиты СБП
Админ может настроить реквизиты через бота:
- `/admin` → `💰 Финансы` → `📝 Реквизиты СБП`

## 🔧 Мониторинг и отладка

### Логи
```bash
# Локи Render
# Render Dashboard → Logs

# Локальные логи
npm start
```

### Health Check
Бот имеет встроенную проверку здоровья:
```javascript
// Автоматический перезапуск при ошибках
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('TERM'));
```

## 🔄 CI/CD

### GitHub Actions (опционально)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Render
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        run: curl $RENDER_DEPLOY_HOOK
```

## 🚨 Безопасность

### Переменные окружения
- Никогда не храните токены в коде
- Используйте Environment Variables
- В проде используйте Service Role Key для Supabase

### Безопасность бота
- Валидация всех входных данных
- Проверка прав админа
- Защита от спама

## 📊 Масштабирование

### Render
- Free tier: 750 часов/месяц
- Pro tier: $7/месяц за больше ресурсов

### Supabase
- Free tier: 500MB БД, 50k API вызовов
- Pro tier: $25/месяц

### Оптимизация
- Кэширование в Redis
- CDN для статики
- Балансировка нагрузки

## 🔧 Поддержка и развитие

### Бэкапы
```bash
# Supabase бэкапы автоматические
# GitHub бэкапы кода
```

### Мониторинг
- Render Analytics
- Supabase Logs
- Telegram Bot Analytics

### Обновления
```bash
git pull origin main
npm install  # если изменились зависимости
```

## 📞 Контакты

- Разработчик: @nafoxxee
- Проект: Lavka26 Bot
- GitHub: https://github.com/nafoxxee/lavka26-bot

---

**Примечание:** Этот проект использует современные технологии и лучшие практики разработки. Все компоненты готовы к продакшн-использованию.
