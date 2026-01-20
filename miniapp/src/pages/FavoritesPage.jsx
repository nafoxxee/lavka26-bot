import React, { useState } from 'react'
import { Heart } from 'lucide-react'

const FavoritesPage = () => {
  const [favorites] = useState([
    {
      id: 1,
      title: 'iPhone 13 Pro',
      description: 'Отличное состояние, 256GB, почти новый',
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
      description: 'Новая, размер M, теплая',
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
  ])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4">
          <h1 className="text-lg font-semibold">Избранное</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💔</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет избранных</h3>
            <p className="text-gray-600">Добавьте объявления в избранное</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((ad) => (
              <div key={ad.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                <div className="aspect-square bg-gray-200 rounded-t-lg flex items-center justify-center">
                  <div className="text-4xl text-gray-400">📷</div>
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
                      <div className="w-6 h-6 rounded-full bg-gray-300 mr-2"></div>
                      <span>
                        {ad.users?.first_name} {ad.users?.last_name}
                      </span>
                    </div>
                    <span>Сегодня</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FavoritesPage
