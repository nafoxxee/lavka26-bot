@echo off
chcp 65001 >nul
title Lavka26 Bot - Запуск
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🚀 LAVKA26 BOT                           ║
echo ║                  Рекламные объявления                         ║
echo ║                     Монетизация готова                        ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

cd /d "c:\Users\dudki\lavka26-bot"

echo 📦 Проверка зависимостей...
python -c "import telegram; print('✅ python-telegram-bot установлен')" 2>nul
if errorlevel 1 (
    echo ❌ Библиотека telegram не установлена
    echo 📦 Установка зависимостей...
    python -m pip install python-telegram-bot python-dotenv
    if errorlevel 1 (
        echo ❌ Ошибка установки зависимостей
        pause
        exit /b 1
    )
)

echo.
echo 🔍 Проверка конфигурации...
if not exist .env (
    echo ❌ Файл .env не найден
    pause
    exit /b 1
)

echo ✅ Конфигурация найдена
echo.
echo 🚀 Запуск бота...
echo 📢 Рекламные объявления готовы к монетизации!
echo 💰 Стоимость: от 50 ₽ за объявление
echo 📱 Заходите в Telegram и тестируйте!
echo.
echo ══════════════════════════════════════════════════════════════
echo.

python simple_start.py

if errorlevel 1 (
    echo.
    echo ❌ Бот завершился с ошибкой
    echo 💡 Проверьте:
    echo    • TELEGRAM_BOT_TOKEN в .env
    echo    • Подключение к интернету
    echo    • Установленные зависимости
    echo.
)

pause
