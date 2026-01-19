import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Star, 
  MapPin, 
  Eye, 
  Share2,
  Phone,
  User
} from 'lucide-react'
import { formatPrice, formatDate, formatRelativeTime } from '../utils/formatters'
import api from '../utils/api'
import toast from 'react-hot-toast'

const AdPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const { data: ad, isLoading, error } = useQuery({
    queryKey: ['ad', id],
    queryFn: async () => {
      const response = await api.get(`/ads/${id}`)
      return response.data
    }
  })

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (ad.favorites?.length > 0) {
        await api.delete(`/users/favorites/${id}`)
      } else {
        await api.post(`/users/favorites/${id}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ad', id])
      queryClient.invalidateQueries(['ads'])
      queryClient.invalidateQueries(['favorites'])
      toast.success(ad.favorites?.length > 0 ? 'Удалено из избранного' : 'Добавлено в избранное')
    },
    onError: () => {
      toast.error('Ошибка при работе с избранным')
    }
  })

  const createChatMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/chats', { adId: id })
      return response.data
    },
    onSuccess: (chat) => {
      navigate(`/chat/${chat.id}`)
    },
    onError: (error) => {
      if (error.response?.status === 409) {
        navigate(`/chat/${error.response.data.chat.id}`)
      } else {
        toast.error('Ошибка создания чата')
      }
    }
  })

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: ad.title,
          text: `${ad.title} - ${formatPrice(ad.price)}`,
          url: window.location.href
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Ссылка скопирована')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="skeleton h-64 w-full rounded-lg mb-6"></div>
          <div className="skeleton h-8 w-3/4 mb-4"></div>
          <div className="skeleton h-6 w-1/2 mb-6"></div>
          <div className="space-y-3">
            <div className="skeleton h-4 w-full"></div>
            <div className="skeleton h-4 w-full"></div>
            <div className="skeleton h-4 w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !ad) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Объявление не найдено</p>
          <button onClick={() => navigate('/feed')} className="btn btn-primary">
            Вернуться к ленте
          </button>
        </div>
      </div>
    )
  }

  const isFavorited = ad.favorites?.length > 0
  const currentImage = ad.images?.[currentImageIndex]

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Share2 size={20} />
          </button>
          
          <button
            onClick={() => toggleFavoriteMutation.mutate()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Heart
              size={20}
              className={isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}
            />
          </button>
        </div>
      </div>

      {/* Images */}
      <div className="mb-6">
        {currentImage ? (
          <div className="relative">
            <img
              src={currentImage}
              alt={ad.title}
              className="w-full h-64 object-cover rounded-lg"
            />
            
            {/* Boosted badge */}
            {ad.is_boosted && (
              <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                <Star size={14} fill="currentColor" />
                Поднято
              </div>
            )}
            
            {/* Image navigation */}
            {ad.images?.length > 1 && (
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1">
                {ad.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
            <ImageIcon size={48} className="text-gray-400" />
          </div>
        )}
      </div>

      {/* Title and Price */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{ad.title}</h1>
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold text-primary-600">
            {formatPrice(ad.price)}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Eye size={16} />
              {ad.views || 0}
            </span>
            <span>{formatRelativeTime(ad.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Category */}
      {ad.category && (
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
            <span>{ad.category.icon}</span>
            <span className="text-sm font-medium">{ad.category.name}</span>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Описание</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{ad.description}</p>
      </div>

      {/* Location */}
      {ad.location && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Местоположение</h2>
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin size={18} />
            <span>{ad.location}</span>
          </div>
        </div>
      )}

      {/* Author Info */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <User size={20} className="text-gray-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {ad.user?.first_name || ad.user?.username || 'Пользователь'}
              </div>
              <div className="text-sm text-gray-500">
                На платформе с {formatDate(ad.user?.created_at)}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => createChatMutation.mutate()}
            disabled={createChatMutation.isLoading}
            className="btn btn-primary"
          >
            <MessageCircle size={16} className="mr-2" />
            Написать
          </button>
        </div>
      </div>

      {/* Status */}
      {ad.status !== 'active' && (
        <div className="card p-4 bg-yellow-50 border-yellow-200">
          <p className="text-yellow-800 text-sm">
            Статус объявления: {ad.status === 'pending' ? 'На модерации' : 
                            ad.status === 'draft' ? 'Черновик' : 
                            ad.status === 'blocked' ? 'Заблокировано' : 'Истекло'}
          </p>
        </div>
      )}
    </div>
  )
}

export default AdPage
