from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY
import logging

logger = logging.getLogger(__name__)

# Инициализация Supabase клиента
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class SupabaseDB:
    """Класс для работы с Supabase"""
    
    def __init__(self):
        self.client = supabase
    
    async def test_connection(self):
        """Тест подключения к Supabase"""
        try:
            response = self.client.table('users').select('count').execute()
            logger.info("✅ Подключение к Supabase успешно")
            return True
        except Exception as e:
            logger.error(f"❌ Ошибка подключения к Supabase: {e}")
            return False
    
    # Пользователи
    async def get_or_create_user(self, telegram_id: int, username: str = None, 
                                first_name: str = None, last_name: str = None):
        """Получить или создать пользователя"""
        try:
            # Проверяем существующего пользователя
            response = self.client.table('users').select('*').eq('telegram_id', telegram_id).execute()
            
            if response.data:
                return response.data[0]
            
            # Создаем нового пользователя
            user_data = {
                'telegram_id': telegram_id,
                'username': username,
                'first_name': first_name,
                'last_name': last_name
            }
            
            response = self.client.table('users').insert(user_data).execute()
            return response.data[0]
            
        except Exception as e:
            logger.error(f"Ошибка при работе с пользователем: {e}")
            return None
    
    # Объявления
    async def create_ad(self, ad_data: dict):
        """Создать объявление"""
        try:
            response = self.client.table('ads').insert(ad_data).execute()
            return response.data[0]
        except Exception as e:
            logger.error(f"Ошибка создания объявления: {e}")
            return None
    
    async def get_ads(self, category_id: int = None, status: str = 'active', 
                     sort_by: str = 'created_at', order: str = 'desc'):
        """Получить объявления"""
        try:
            query = self.client.table('ads').select('*').eq('status', status)
            
            if category_id:
                query = query.eq('category_id', category_id)
            
            query = query.order(sort_by, {'ascending': order == 'asc'})
            response = query.execute()
            return response.data
        except Exception as e:
            logger.error(f"Ошибка получения объявлений: {e}")
            return []
    
    async def get_user_ads(self, user_id: int, status: str = 'active'):
        """Получить объявления пользователя"""
        try:
            response = self.client.table('ads').select('*').eq('user_id', user_id).eq('status', status).execute()
            return response.data
        except Exception as e:
            logger.error(f"Ошибка получения объявлений пользователя: {e}")
            return []
    
    async def search_ads(self, search_text: str):
        """Поиск объявлений"""
        try:
            response = self.client.table('ads').select('*').eq('status', 'active').or_(
                f'title.ilike.%{search_text}%,description.ilike.%{search_text}%'
            ).execute()
            return response.data
        except Exception as e:
            logger.error(f"Ошибка поиска объявлений: {e}")
            return []
    
    # Категории
    async def get_categories(self):
        """Получить категории"""
        try:
            response = self.client.table('categories').select('*').order('order').execute()
            return response.data
        except Exception as e:
            logger.error(f"Ошибка получения категорий: {e}")
            return []
    
    async def init_categories(self):
        """Инициализация категорий"""
        categories = [
            {"name": "Транспорт", "emoji": "🚗", "order": 1},
            {"name": "Недвижимость", "emoji": "🏠", "order": 2},
            {"name": "Работа", "emoji": "💼", "order": 3},
            {"name": "Услуги", "emoji": "🛠", "order": 4},
            {"name": "Личные вещи", "emoji": "👕", "order": 5},
            {"name": "Электроника", "emoji": "📱", "order": 6},
            {"name": "Дом и сад", "emoji": "🌿", "order": 7},
            {"name": "Животные", "emoji": "🐶", "order": 8},
            {"name": "Хобби и отдых", "emoji": "🎮", "order": 9},
            {"name": "Для бизнеса", "emoji": "🏭", "order": 10},
            {"name": "Красота и здоровье", "emoji": "💄", "order": 11},
            {"name": "Билеты и путешествия", "emoji": "✈", "order": 12},
            {"name": "Строительство и ремонт", "emoji": "🏗", "order": 13},
            {"name": "Прочее", "emoji": "📦", "order": 14}
        ]
        
        try:
            for cat in categories:
                # Проверяем существование категории
                existing = self.client.table('categories').select('*').eq('name', cat['name']).execute()
                if not existing.data:
                    self.client.table('categories').insert(cat).execute()
            
            logger.info("✅ Категории успешно инициализированы")
            return True
        except Exception as e:
            logger.error(f"Ошибка инициализации категорий: {e}")
            return False
    
    # Избранное
    async def add_to_favorites(self, user_id: int, ad_id: int):
        """Добавить в избранное"""
        try:
            # Проверяем, нет ли уже в избранном
            existing = self.client.table('favorites').select('*').eq('user_id', user_id).eq('ad_id', ad_id).execute()
            if not existing.data:
                self.client.table('favorites').insert({'user_id': user_id, 'ad_id': ad_id}).execute()
                return True
            return False
        except Exception as e:
            logger.error(f"Ошибка добавления в избранное: {e}")
            return False
    
    async def get_favorites(self, user_id: int):
        """Получить избранные объявления"""
        try:
            response = self.client.table('favorites').select(
                '*, ads(*)'
            ).eq('user_id', user_id).execute()
            return response.data
        except Exception as e:
            logger.error(f"Ошибка получения избранного: {e}")
            return []
    
    # Платежи
    async def create_payment(self, payment_data: dict):
        """Создать платеж"""
        try:
            response = self.client.table('payments').insert(payment_data).execute()
            return response.data[0]
        except Exception as e:
            logger.error(f"Ошибка создания платежа: {e}")
            return None
    
    async def update_payment_status(self, payment_id: int, status: str):
        """Обновить статус платежа"""
        try:
            response = self.client.table('payments').update({'status': status}).eq('id', payment_id).execute()
            return response.data[0]
        except Exception as e:
            logger.error(f"Ошибка обновления статуса платежа: {e}")
            return None
    
    async def get_user(self, telegram_id: int):
        """Получить пользователя по telegram_id"""
        try:
            response = self.client.table('users').select('*').eq('telegram_id', telegram_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Ошибка получения пользователя: {e}")
            return None
    
    async def get_payment_by_telegram_id(self, telegram_payment_id: str):
        """Получить платеж по telegram_payment_id"""
        try:
            response = self.client.table('payments').select('*').eq('telegram_payment_id', telegram_payment_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Ошибка получения платежа: {e}")
            return None
    
    async def get_user_active_ads_count(self, user_id: int):
        """Получить количество активных объявлений пользователя"""
        try:
            response = self.client.table('ads').select('count').eq('user_id', user_id).eq('status', 'active').execute()
            return len(response.data) if response.data else 0
        except Exception as e:
            logger.error(f"Ошибка подсчета активных объявлений: {e}")
            return 0
    
    async def get_user_completed_payments_count(self, user_id: int, payment_type: str):
        """Получить количество завершенных платежей определенного типа"""
        try:
            response = self.client.table('payments').select('count').eq('user_id', user_id).eq('type', payment_type).eq('status', 'completed').execute()
            return len(response.data) if response.data else 0
        except Exception as e:
            logger.error(f"Ошибка подсчета платежей: {e}")
            return 0
    
    async def get_user_payments(self, user_id: int, limit: int = 10):
        """Получить платежи пользователя"""
        try:
            response = self.client.table('payments').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(limit).execute()
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"Ошибка получения платежей пользователя: {e}")
            return []

# Глобальный экземпляр для работы с БД
db = SupabaseDB()
