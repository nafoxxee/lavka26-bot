import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Users, 
  FileText, 
  MessageCircle, 
  CreditCard, 
  TrendingUp,
  Check,
  X,
  Eye,
  Ban
} from 'lucide-react'
import { formatPrice, formatRelativeTime } from '../utils/formatters'
import { useAuth } from '../contexts/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'

const AdminPage = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('stats')

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/stats')
      return response.data
    }
  })

  const { data: pendingAds } = useQuery({
    queryKey: ['pending-ads'],
    queryFn: async () => {
      const response = await api.get('/admin/ads/pending')
      return response.data
    }
  })

  const moderateAdMutation = useMutation({
    mutationFn: async ({ adId, action, reason }) => {
      const response = await api.post(`/admin/ads/${adId}/moderate`, { action, reason })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-ads'])
      queryClient.invalidateQueries(['admin-stats'])
      toast.success('Действие выполнено')
    },
    onError: () => {
      toast.error('Ошибка выполнения действия')
    }
  })

  const handleModerate = (adId, action) => {
    const reason = action === 'reject' || action === 'block' 
      ? prompt('Укажите причину:') 
      : null

    if (action !== 'approve' && reason === null) return

    moderateAdMutation.mutate({ adId, action, reason })
  }

  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Доступ запрещен</p>
          <p className="text-gray-600">У вас нет прав для доступа к админ панели</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Админ панель</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'stats' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <TrendingUp size={16} className="inline mr-2" />
          Статистика
        </button>
        
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'pending' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FileText size={16} className="inline mr-2" />
          Модерация
          {pendingAds?.length > 0 && (
            <span className="ml-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
              {pendingAds.length}
            </span>
          )}
        </button>
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 text-center">
            <Users className="text-primary-600 mx-auto mb-2" size={24} />
            <div className="text-2xl font-bold text-gray-900">
              {stats?.totalUsers || 0}
            </div>
            <div className="text-sm text-gray-600">Пользователей</div>
          </div>
          
          <div className="card p-4 text-center">
            <FileText className="text-primary-600 mx-auto mb-2" size={24} />
            <div className="text-2xl font-bold text-gray-900">
              {stats?.totalAds || 0}
            </div>
            <div className="text-sm text-gray-600">Объявлений</div>
          </div>
          
          <div className="card p-4 text-center">
            <MessageCircle className="text-primary-600 mx-auto mb-2" size={24} />
            <div className="text-2xl font-bold text-gray-900">
              {stats?.totalChats || 0}
            </div>
            <div className="text-sm text-gray-600">Чатов</div>
          </div>
          
          <div className="card p-4 text-center">
            <CreditCard className="text-primary-600 mx-auto mb-2" size={24} />
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(stats?.totalRevenue || 0)}
            </div>
            <div className="text-sm text-gray-600">Доход</div>
          </div>
        </div>
      )}

      {/* Pending Ads Tab */}
      {activeTab === 'pending' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Объявления на модерации
            </h2>
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
              {pendingAds?.length || 0}
            </span>
          </div>

          {!pendingAds || pendingAds.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="text-gray-300 mx-auto mb-4" size={48} />
              <p className="text-gray-600">Нет объявлений на модерации</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAds.map((ad) => (
                <div key={ad.id} className="card p-4">
                  <div className="flex gap-4">
                    {/* Image */}
                    {ad.images?.[0] ? (
                      <img
                        src={ad.images[0]}
                        alt={ad.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                        <FileText size={24} className="text-gray-400" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {ad.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {formatPrice(ad.price)} • {ad.category?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {ad.user?.username || ad.user?.first_name} • {formatRelativeTime(ad.created_at)}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                        {ad.description}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleModerate(ad.id, 'approve')}
                          className="btn btn-primary text-sm"
                        >
                          <Check size={16} className="mr-1" />
                          Одобрить
                        </button>
                        
                        <button
                          onClick={() => handleModerate(ad.id, 'reject')}
                          className="btn btn-secondary text-sm"
                        >
                          <X size={16} className="mr-1" />
                          Отклонить
                        </button>
                        
                        <button
                          onClick={() => handleModerate(ad.id, 'block')}
                          className="btn btn-danger text-sm"
                        >
                          <Ban size={16} className="mr-1" />
                          Заблокировать
                        </button>
                        
                        <button
                          onClick={() => window.open(`/ad/${ad.id}`, '_blank')}
                          className="btn btn-secondary text-sm"
                        >
                          <Eye size={16} className="mr-1" />
                          Просмотр
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminPage
