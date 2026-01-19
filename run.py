#!/usr/bin/env python3
"""
Запуск бота Lavka26
"""

import asyncio
import logging
from bot import main

if __name__ == '__main__':
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    print("🚀 Запуск бота Lavka26...")
    print("📍 Торговая площадка объявлений города Михайловска")
    print("-" * 50)
    
    try:
        main()
    except KeyboardInterrupt:
        print("\n👋 Бот остановлен")
    except Exception as e:
        print(f"❌ Ошибка при запуске бота: {e}")
        logging.error(f"Ошибка при запуске бота: {e}", exc_info=True)
