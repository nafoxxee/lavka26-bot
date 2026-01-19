#!/usr/bin/env python3
"""
Установка зависимостей через Python
"""

import subprocess
import sys

def install_package(package):
    """Установка пакета"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✅ {package} установлен")
        return True
    except subprocess.CalledProcessError:
        print(f"❌ Ошибка установки {package}")
        return False

def main():
    print("🔧 Установка зависимостей Lavka26 Bot")
    print("=" * 50)
    
    packages = [
        "python-telegram-bot",
        "supabase", 
        "python-dotenv"
    ]
    
    success = True
    for package in packages:
        if not install_package(package):
            success = False
    
    if success:
        print("\n🎉 Все зависимости установлены!")
        print("🚀 Теперь можно запускать бота")
    else:
        print("\n❌ Возникли проблемы с установкой")
        print("💡 Установите пакеты вручную:")
        for package in packages:
            print(f"   pip install {package}")

if __name__ == "__main__":
    main()
