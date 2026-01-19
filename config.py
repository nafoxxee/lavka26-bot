import os
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
DATABASE_URL = os.getenv('DATABASE_URL')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
PAYMENT_PROVIDER_TOKEN = os.getenv('PAYMENT_PROVIDER_TOKEN')
ADMIN_ID = int(os.getenv('ADMIN_ID', 0))
CHANNEL_ID = os.getenv('CHANNEL_ID')

FREE_ADS_LIMIT = 5
AD_PRICE = 100  # руб за дополнительное объявление
PROMO_AD_PRICE = 50  # руб за рекламное объявление
PROMOTION_PRICES = {
    'boost_day': 50,    # поднять на сутки
    'boost_week': 200,  # поднять на неделю
    'pin_month': 500    # закрепить на месяц
}
