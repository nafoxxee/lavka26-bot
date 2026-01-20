import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Settings, LogOut, Package, Heart, Star } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext-test'

const ProfilePage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('my-ads')

  const menuItems = [
    {
      id: 'my-ads',
      name: 'Мои объявления',
      icon: Package,
      count: 5
    },
    {
      id: 'favorites',
      name: 'Избранное',
      icon: Heart,
      count: 12
    },
    {
      id: 'reviews',
      name: 'Отзывы',
      icon: Star,
      count: 8
    },
    {
      id: 'settings',
      name: 'Настройки',
      icon: Settings,
      count: 0
    }
  ]

  const handleLogout = () => {
    logout()
    navigate('/feed')
  }

  const isAdmin = user?.telegram_id === 12345 // Замените на реальный ID админа

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="p-4">
          <h1 className="text-lg font-semibold">Профиль</h1>
        </div>
      </div>

      {/* User Info */}
      <div className="bg-white p-4 border-b">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
            {user?.photo_url ? (
              <img
                src={user.photo_url}
                alt={user.first_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User size={24} className="text-gray-500" />
            )}
          </div>
          
          <div className="flex-1">
            <h2 className="text-lg font-semibold">
              {user?.first_name} {user?.last_name}
            </h2>
            <p className="text-gray-600">@{user?.username}</p>
            {isAdmin && (
              <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mt-1">
                Администратор
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="bg-white">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-4 border-b hover:bg-gray-50 transition-colors ${
                activeTab === item.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon size={20} className={activeTab === item.id ? 'text-blue-600' : 'text-gray-600'} />
                <span className={`font-medium ${activeTab === item.id ? 'text-blue-600' : 'text-gray-900'}`}>
                  {item.name}
                </span>
              </div>
              {item.count > 0 && (
                <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
                  {item.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Admin Panel */}
      {isAdmin && (
        <div className="bg-white mt-4">
          <button
            onClick={() => navigate('/admin')}
            className="w-full flex items-center justify-between p-4 border-b hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Settings size={20} className="text-red-600" />
              <span className="font-medium text-red-600">
                Панель администратора
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Logout */}
      <div className="bg-white mt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 p-4 hover:bg-gray-50 transition-colors"
        >
          <LogOut size={20} className="text-red-600" />
          <span className="font-medium text-red-600">Выйти</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'my-ads' && (
          <div className="text-center py-8">
            <Package size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Мои объявления</h3>
            <p className="text-gray-600">У вас 5 активных объявлений</p>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="text-center py-8">
            <Heart size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Избранное</h3>
            <p className="text-gray-600">У вас 12 избранных объявлений</p>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="text-center py-8">
            <Star size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Отзывы</h3>
            <p className="text-gray-600">Ваш рейтинг: 4.8/5 (8 отзывов)</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="text-center py-8">
            <Settings size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Настройки</h3>
            <p className="text-gray-600">Настройки профиля и приложения</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfilePage
