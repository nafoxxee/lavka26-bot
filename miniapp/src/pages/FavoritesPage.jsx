import { useQuery } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import AdCard from '../components/AdCard'
import AdCardSkeleton from '../components/AdCardSkeleton'
import api from '../utils/api'

const FavoritesPage = () => {
  const { data: ads, isLoading, error } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const response = await api.get('/users/favorites')
      return response.data
    }
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Избранное</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <AdCardSkeleton key={index} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Избранное</h1>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Ошибка загрузки избранного</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Heart className="text-red-500" size={28} />
        <h1 className="text-2xl font-bold text-gray-900">Избранное</h1>
        {ads && (
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
            {ads.length}
          </span>
        )}
      </div>

      {/* Favorites List */}
      {!ads || ads.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="text-gray-300 mx-auto mb-4" size={48} />
          <p className="text-gray-600 mb-2">У вас нет избранных объявлений</p>
          <p className="text-sm text-gray-500 mb-6">
            Добавляйте понравившиеся объявления, чтобы быстро находить их
          </p>
          <a href="/feed" className="btn btn-primary">
            Перейти к ленте
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      )}
    </div>
  )
}

export default FavoritesPage
