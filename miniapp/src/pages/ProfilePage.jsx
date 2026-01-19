import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Settings, LogOut, BarChart3, Package, Star } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'

const ProfilePage = () => {
  const { user, logout, isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    phone: ''
  })

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get('/users/profile')
      return response.data
    }
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/users/profile', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profile'])
      setIsEditing(false)
      toast.success('Профиль обновлен')
    },
    onError: () => {
      toast.error('Ошибка обновления профиля')
    }
  })

  const handleEdit = () => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        phone: profile.phone || ''
      })
    }
    setIsEditing(true)
  }

  const handleSave = () => {
    updateProfileMutation.mutate({
      username: formData.username,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      username: '',
      firstName: '',
      lastName: '',
      phone: ''
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="skeleton h-32 w-32 rounded-full mx-auto mb-4"></div>
          <div className="skeleton h-6 w-48 mx-auto mb-2"></div>
          <div className="skeleton h-4 w-32 mx-auto mb-6"></div>
          <div className="space-y-3">
            <div className="skeleton h-16 w-full"></div>
            <div className="skeleton h-16 w-full"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-primary-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <User size={40} className="text-primary-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {profile?.first_name || profile?.username || 'Пользователь'}
        </h1>
        
        <p className="text-gray-600">@{profile?.username || 'unknown'}</p>
        
        {isAdmin && (
          <div className="mt-2 inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
            <Star size={14} fill="currentColor" />
            Администратор
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card p-4 text-center">
          <Package className="text-primary-600 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-gray-900">
            {profile?.stats?.total_ads || 0}
          </div>
          <div className="text-sm text-gray-600">Объявлений</div>
        </div>
        
        <div className="card p-4 text-center">
          <BarChart3 className="text-primary-600 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-gray-900">
            {profile?.stats?.total_views || 0}
          </div>
          <div className="text-sm text-gray-600">Просмотров</div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Информация о профиле</h2>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="btn btn-secondary text-sm"
            >
              <Settings size={16} className="mr-1" />
              Редактировать
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Имя пользователя
              </label>
              <input
                type="text"
                className="input"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="@username"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Имя
              </label>
              <input
                type="text"
                className="input"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Ваше имя"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Фамилия
              </label>
              <input
                type="text"
                className="input"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Ваша фамилия"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Телефон
              </label>
              <input
                type="tel"
                className="input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+7 (999) 123-45-67"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={updateProfileMutation.isLoading}
                className="btn btn-primary flex-1"
              >
                {updateProfileMutation.isLoading ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                onClick={handleCancel}
                className="btn btn-secondary"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Имя пользователя</span>
              <span className="font-medium">@{profile?.username || 'Не указано'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Имя</span>
              <span className="font-medium">{profile?.first_name || 'Не указано'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Фамилия</span>
              <span className="font-medium">{profile?.last_name || 'Не указано'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Телефон</span>
              <span className="font-medium">{profile?.phone || 'Не указан'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Admin Link */}
      {isAdmin && (
        <a
          href="/admin"
          className="card p-4 block hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="text-yellow-500" size={20} />
              <span className="font-medium">Админ панель</span>
            </div>
            <span className="text-gray-400">→</span>
          </div>
        </a>
      )}

      {/* Logout Button */}
      <button
        onClick={logout}
        className="btn btn-danger w-full mt-6"
      >
        <LogOut size={16} className="mr-2" />
        Выйти
      </button>
    </div>
  )
}

export default ProfilePage
