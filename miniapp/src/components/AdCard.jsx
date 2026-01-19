import { Link } from 'react-router-dom'
import { Heart, Eye, Star, MapPin } from 'lucide-react'
import { formatPrice, formatRelativeTime, truncateText } from '../utils/formatters'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import toast from 'react-hot-toast'

const AdCard = ({ ad }) => {
  const queryClient = useQueryClient()

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (ad.favorites?.length > 0) {
        await api.delete(`/users/favorites/${ad.id}`)
      } else {
        await api.post(`/users/favorites/${ad.id}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ads'])
      queryClient.invalidateQueries(['favorites'])
      toast.success(ad.favorites?.length > 0 ? 'Удалено из избранного' : 'Добавлено в избранное')
    },
    onError: () => {
      toast.error('Ошибка при работе с избранным')
    }
  })

  const handleFavoriteClick = (e) => {
    e.preventDefault()
    toggleFavorite.mutate()
  }

  const isFavorited = ad.favorites?.length > 0
  const mainImage = ad.images?.[0]

  return (
    <Link to={`/ad/${ad.id}`} className="block">
      <div className={`ad-card ${ad.is_boosted ? 'ad-card-boosted' : ''}`}>
        {/* Image */}
        <div className="relative">
          {mainImage ? (
            <img
              src={mainImage}
              alt={ad.title}
              className="ad-card-image"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">Нет фото</span>
            </div>
          )}
          
          {/* Boosted badge */}
          {ad.is_boosted && (
            <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <Star size={12} fill="currentColor" />
              Поднято
            </div>
          )}

          {/* Favorite button */}
          <button
            onClick={handleFavoriteClick}
            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
          >
            <Heart
              size={18}
              className={isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}
            />
          </button>

          {/* Category */}
          {ad.category && (
            <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
              {ad.category.icon} {ad.category.name}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {truncateText(ad.title, 50)}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {truncateText(ad.description, 80)}
          </p>

          {/* Price */}
          <div className="text-xl font-bold text-primary-600 mb-3">
            {formatPrice(ad.price)}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye size={14} />
                {ad.views || 0}
              </span>
              {ad.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {truncateText(ad.location, 15)}
                </span>
              )}
            </div>
            <span>{formatRelativeTime(ad.created_at)}</span>
          </div>

          {/* Author */}
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
            <span className="text-xs text-gray-600">
              {ad.user?.username || ad.user?.first_name || 'Аноним'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default AdCard
