@echo off
chcp 65001 >nul
title Lavka26 Bot - Оплата СБП
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🚀 LAVKA26 BOT                           ║
echo ║                РУЧНАЯ ОПЛАТА ЧЕРЕЗ СБП                        ║
echo ║                  💰 199 ₽ - БЕЗ КОМИССИЙ                      ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

cd /d "c:\Users\dudki\lavka26-bot"

echo 🔍 Проверка конфигурации...
if not exist .env (
    echo ❌ Файл .env не найден
    echo 💡 Создайте файл .env с TELEGRAM_BOT_TOKEN и ADMIN_ID
    pause
    exit /b 1
)

echo ✅ Конфигурация найдена
echo.
echo 🚀 Запуск бота с оплатой СБП...
echo 💰 Стоимость рекламы: 199 ₽
echo 👑 Администратор: %ADMIN_ID%
echo 📱 Пользователи могут оплачивать через СБП
echo.
echo ══════════════════════════════════════════════════════════════
echo.

python lavka26_sbp.py

if errorlevel 1 (
    echo.
    echo ❌ Бот завершился с ошибкой
    echo 💡 Проверьте:
    echo    • TELEGRAM_BOT_TOKEN в .env
    echo    • ADMIN_ID в .env
    echo    • Установленные зависимости
    echo.
)

pause
