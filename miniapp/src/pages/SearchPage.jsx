import React, { useState, useEffect } from 'react'
import { Search, Filter } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext-test'

const SearchPage = () => {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(false)

  const categories = [
    { id: 'all', name: 'Все категории' },
    { id: 'electronics', name: 'Электроника' },
    { id: 'clothing', name: 'Одежда' },
    { id: 'home', name: 'Дом' },
    { id: 'auto', name: 'Авто' },
    { id: 'services', name: 'Услуги' }
  ]

  const mockAds = [
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
  ]

  const handleSearch = async () => {
    setLoading(true)
    
    // Имитация поиска
    setTimeout(() => {
      const filtered = mockAds.filter(ad => {
        const matchesSearch = ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           ad.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || ad.category === selectedCategory
        return matchesSearch && matchesCategory
      })
      
      setAds(filtered)
      setLoading(false)
    }, 500)
  }

  useEffect(() => {
    handleSearch()
  }, [searchQuery, selectedCategory])

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
          <h1 className="text-lg font-semibold mb-3">Поиск объявлений</h1>
          
          {/* Search Input */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию или описанию..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ничего не найдено</h3>
            <p className="text-gray-600">Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Найдено объявлений: {ads.length}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ads.map(ad => (
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
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchPage
