@echo off
chcp 65001 >nul
title Lavka26 Bot - Запуск

echo ========================================
echo Lavka26 Bot - Запуск системы
echo ========================================
echo.

echo [1/5] Проверка Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python не найден!
    echo 💡 Установите Python с https://python.org
    pause
    exit /b 1
)
echo ✅ Python найден

echo.
echo [2/5] Установка зависимостей...
python -m pip install python-telegram-bot supabase python-dotenv --quiet
if errorlevel 1 (
    echo ⚠️ Возможны проблемы с установкой пакетов
) else (
    echo ✅ Зависимости установлены
)

echo.
echo [3/5] Проверка файлов...
if not exist ".env" (
    echo ❌ Файл .env не найден!
    pause
    exit /b 1
)
if not exist "lavka26_admin_sbp.py" (
    echo ❌ Файл бота не найден!
    pause
    exit /b 1
)
if not exist "payment_requisites.json" (
    echo ⚠️ Создание файла реквизитов...
    echo {"bank_name": "Сбер", "phone": "+79001234567", "recipient": "Иван Иванов", "card_last_digits": "1234", "qr_code_url": "", "instructions": "Переведите 199₽ на указанные реквизиты с комментарием Lavka26_{ваш_telegram_id}"} > payment_requisites.json
)
echo ✅ Файлы проверены

echo.
echo [4/5] Настройка Supabase...
if exist "simple_migrate.py" (
    echo 📡 Создание таблиц в Supabase...
    python simple_migrate.py
)

echo.
echo [5/5] Запуск бота...
echo ========================================
echo 🚀 Lavka26 Bot запускается...
echo 💡 Найдите бота в Telegram и начните диалог
echo 💡 Админские команды доступны вашему ID: 379036860
echo ========================================
echo.

python lavka26_admin_sbp.py

echo.
echo Бот остановлен. Нажмите любую клавишу для выхода...
pause >nul
