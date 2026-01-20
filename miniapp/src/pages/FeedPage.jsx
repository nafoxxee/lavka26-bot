import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const FeedPage = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories] = useState([
    { id: 'all', name: 'Все', icon: '📱' },
    { id: 'electronics', name: 'Электроника', icon: '💻' },
    { id: 'clothing', name: 'Одежда', icon: '👕' },
    { id: 'home', name: 'Дом', icon: '🏠' },
    { id: 'auto', name: 'Авто', icon: '🚗' },
    { id: 'services', name: 'Услуги', icon: '💼' }
  ]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchAds();
  }, [selectedCategory]);

  const fetchAds = async () => {
    try {
      setLoading(true);
      
      // Проверяем доступность Supabase
      if (!supabase) {
        console.log('⚠️ Supabase не настроен, используем тестовые данные');
        setAds([
          {
            id: 1,
            title: 'iPhone 13 Pro',
            description: 'Отличное состояние, 256GB',
            price: 45000,
            category: 'electronics',
            images: [],
            views: 15,
            favorites_count: 3,
            created_at: new Date().toISOString(),
            users: {
              first_name: 'Тест',
              last_name: 'Пользователь',
              photo_url: ''
            }
          },
          {
            id: 2,
            title: 'Куртка зимняя',
            description: 'Новая, размер M',
            price: 2500,
            category: 'clothing',
            images: [],
            views: 8,
            favorites_count: 1,
            created_at: new Date().toISOString(),
            users: {
              first_name: 'Тест',
              last_name: 'Пользователь',
              photo_url: ''
            }
          }
        ]);
        return;
      }

      let query = supabase
        .from('ads')
        .select(`
          *,
          users!inner(
            telegram_id,
            username,
            first_name,
            last_name,
            photo_url
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching ads:', error);
        setAds([]);
      } else {
        setAds(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Сегодня';
    if (diffDays === 2) return 'Вчера';
    if (diffDays <= 7) return `${diffDays - 1} дня назад`;
    return date.toLocaleDateString('ru-RU');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Categories */}
      <div className="sticky top-0 bg-white z-10 border-b">
        <div className="flex overflow-x-auto p-4 space-x-4">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex flex-col items-center min-w-[60px] p-2 rounded-lg transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-xl mb-1">{category.icon}</span>
              <span className="text-xs">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ads Grid */}
      <div className="p-4">
        {ads.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет объявлений</h3>
            <p className="text-gray-600">В этой категории пока нет объявлений</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ads.map(ad => (
              <div key={ad.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                <div className="aspect-square bg-gray-200 rounded-t-lg flex items-center justify-center">
                  {ad.images && ad.images.length > 0 ? (
                    <img 
                      src={ad.images[0]} 
                      alt={ad.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="text-4xl text-gray-400">📷</div>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{ad.title}</h3>
                    <span className="text-lg font-bold text-blue-600 ml-2">
                      {formatPrice(ad.price)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{ad.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      {ad.users?.photo_url ? (
                        <img 
                          src={ad.users.photo_url} 
                          alt={ad.users.first_name}
                          className="w-6 h-6 rounded-full mr-2"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-300 mr-2"></div>
                      )}
                      <span>
                        {ad.users?.first_name} {ad.users?.last_name}
                      </span>
                    </div>
                    <span>{formatDate(ad.created_at)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        👁️ {ad.views || 0}
                      </span>
                      <span className="flex items-center">
                        ❤️ {ad.favorites_count || 0}
                      </span>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {categories.find(c => c.id === ad.category)?.name || ad.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedPage;
