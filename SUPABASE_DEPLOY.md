# 🚀 Развертывание Lavka26 Bot через Supabase

## 📋 Что нужно сделать:

### 1. Установить Supabase CLI

```bash
# Windows (PowerShell)
iwr -useb https://get.supabase.com/install.ps1 | iex

# macOS
brew install supabase/tap/supabase

# Linux
curl -L https://get.supabase.com/install.sh | bash
```

### 2. Войти в Supabase

```bash
supabase login
```

### 3. Подключить проект

```bash
supabase link --project-ref your-project-ref
```

*Project ref можно найти в настройках проекта Supabase*

### 4. Настроить переменные окружения

Создайте файл `.env` в корне проекта:

```env
TELEGRAM_BOT_TOKEN=8500920411:AAH_lBSuXMpkDLDMs6IRpLhrTe0G9JTaKmg
SUPABASE_URL=https://lgotcmpdfysztzhzvtun.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_ID=379036860
CHANNEL_ID=@lavka26city
```

### 5. Создать таблицы

1. Откройте ваш проект в [supabase.com](https://supabase.com)
2. Перейдите в **SQL Editor**
3. Выполните скрипт из файла `supabase_schema.sql`

### 6. Развернуть Edge Function

```bash
# Развертывание функции
supabase functions deploy telegram-bot

# С переменными окружения
supabase functions deploy telegram-bot --env-file .env
```

### 7. Настроить Webhook

1. Получите URL функции:
   ```bash
   supabase functions list
   ```

2. Установите webhook для Telegram бота:
   ```bash
   curl -X POST "https://api.telegram.org/bot8500920411:AAH_lBSuXMpkDLDMs6IRpLhrTe0G9JTaKmg/setWebhook" \
   -H "Content-Type: application/json" \
   -d '{"url": "https://your-project-ref.supabase.co/functions/v1/telegram-bot"}'
   ```

## 🚀 Локальный запуск

### Для разработки:

```bash
# Запуск локально
npm run dev

# Или прямой запуск
supabase functions serve --env-file .env
```

### Для продакшена:

```bash
# Установка зависимостей
npm install

# Запуск
npm start
```

## 🔧 Проверка работы

1. **Проверить статус webhook:**
   ```bash
   curl "https://api.telegram.org/bot8500920411:AAH_lBSuXMpkDLDMs6IRpLhrTe0G9JTaKmg/getWebhookInfo"
   ```

2. **Тест локально:**
   ```bash
   # Отправить тестовый запрос
   curl -X POST http://localhost:54321/functions/v1/telegram-bot \
   -H "Content-Type: application/json" \
   -d '{"update_id": 123, "message": {"message_id": 1, "from": {"id": 379036860, "first_name": "Test"}, "chat": {"id": 379036860, "first_name": "Test"}, "date": 1642679472, "text": "/start"}}'
   ```

## 📱 Тестирование бота

1. Найдите бота в Telegram
2. Отправьте `/start`
3. Проверьте все функции:
   - 📄 Смотреть объявления
   - ➕ Создать объявление
   - ❤️ Избранное
   - 🔍 Поиск
   - ⚙ Настройки

## 🔥 Преимущества Supabase Edge Functions

- ✅ **Автоматическое масштабирование**
- ✅ **Глобальная CDN**
- ✅ **Бесплатный tier** до 100k запросов/месяц
- ✅ **Интеграция с Supabase Auth и Database**
- ✅ **Автоматические SSL сертификаты**
- ✅ **Мониторинг и логи**

## 📊 Мониторинг

1. **Логи функций:**
   ```bash
   supabase functions logs telegram-bot
   ```

2. **Метрики в Dashboard:**
   - Откройте ваш проект в Supabase
   - Перейдите в **Edge Functions** → **Logs**

## 🔄 Обновление бота

```bash
# Внести изменения в код
# ...

# Развернуть обновление
supabase functions deploy telegram-bot --env-file .env
```

## 🎯 Готово!

После выполнения этих шагов ваш бот Lavka26 будет:
- ✅ Работать на серверах Supabase
- ✅ Автоматически масштабироваться
- ✅ Быть доступен 24/7
- ✅ Интегрирован с базой данных Supabase

**Бот готов к использованию!** 🎉
