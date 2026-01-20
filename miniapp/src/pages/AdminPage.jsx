import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Package, DollarSign, TrendingUp, Settings, Eye, Ban, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext-test'

const AdminPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAds: 0,
    totalRevenue: 0,
    activeAds: 0
  })

  const [ads, setAds] = useState([])
  const [users, setUsers] = useState([])

  const isAdmin = user?.telegram_id === 12345 // Замените на реальный ID админа

  useEffect(() => {
    if (!isAdmin) {
      navigate('/profile')
      return
    }

    // Загрузка статистики
    setStats({
      totalUsers: 1234,
      totalAds: 567,
      totalRevenue: 234500,
      activeAds: 423
    })

    // Загрузка объявлений
    setAds([
      {
        id: 1,
        title: 'iPhone 13 Pro',
        price: 45000,
        status: 'active',
        user: 'user1',
        created_at: '2024-01-15'
      },
      {
        id: 2,
        title: 'Куртка зимняя',
        price: 2500,
        status: 'pending',
        user: 'user2',
        created_at: '2024-01-14'
      }
    ])

    // Загрузка пользователей
    setUsers([
      {
        id: 1,
        username: 'user1',
        first_name: 'Иван',
        last_name: 'Иванов',
        status: 'active',
        ads_count: 5
      },
      {
        id: 2,
        username: 'user2',
        first_name: 'Мария',
        last_name: 'Петрова',
        status: 'banned',
        ads_count: 2
      }
    ])
  }, [isAdmin, navigate])

  const menuItems = [
    {
      id: 'dashboard',
      name: 'Панель управления',
      icon: TrendingUp
    },
    {
      id: 'ads',
      name: 'Объявления',
      icon: Package
    },
    {
      id: 'users',
      name: 'Пользователи',
      icon: Users
    },
    {
      id: 'finance',
      name: 'Финансы',
      icon: DollarSign
    }
  ]

  const handleAdAction = (adId, action) => {
    console.log(`Ad ${adId}: ${action}`)
    // Здесь будет логика управления объявлениями
  }

  const handleUserAction = (userId, action) => {
    console.log(`User ${userId}: ${action}`)
    // Здесь будет логика управления пользователями
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Доступ запрещен</h1>
          <p className="text-gray-600">У вас нет прав администратора</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg mr-3"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold">Панель администратора</h1>
        </div>
      </div>

      {/* Admin Menu */}
      <div className="bg-white border-b">
        <div className="flex overflow-x-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === item.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{item.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Общая статистика</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Всего пользователей</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                  <Users className="text-blue-600" size={24} />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Всего объявлений</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalAds}</p>
                  </div>
                  <Package className="text-green-600" size={24} />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Доход</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue} ₽</p>
                  </div>
                  <DollarSign className="text-yellow-600" size={24} />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Активные объявления</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeAds}</p>
                  </div>
                  <TrendingUp className="text-purple-600" size={24} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ads' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Управление объявлениями</h2>
            
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Цена</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {ads.map((ad) => (
                      <tr key={ad.id}>
                        <td className="px-4 py-2 text-sm">#{ad.id}</td>
                        <td className="px-4 py-2 text-sm font-medium">{ad.title}</td>
                        <td className="px-4 py-2 text-sm">{ad.price} ₽</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            ad.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {ad.status === 'active' ? 'Активно' : 'На модерации'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAdAction(ad.id, 'view')}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Eye size={16} />
                            </button>
                            {ad.status === 'pending' && (
                              <button
                                onClick={() => handleAdAction(ad.id, 'approve')}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                              >
                                <Check size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleAdAction(ad.id, 'delete')}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Ban size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Управление пользователями</h2>
            
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Пользователь</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Объявления</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-2">
                          <div>
                            <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
                            <p className="text-xs text-gray-500">@{user.username}</p>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm">{user.ads_count}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status === 'active' ? 'Активен' : 'Заблокирован'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleUserAction(user.id, 'view')}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Eye size={16} />
                            </button>
                            {user.status === 'active' ? (
                              <button
                                onClick={() => handleUserAction(user.id, 'ban')}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Ban size={16} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUserAction(user.id, 'unban')}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                              >
                                <Check size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Финансовая статистика</h2>
            
            <div className="bg-white p-6 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Доходы</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Платные объявления:</span>
                      <span className="font-medium">150,000 ₽</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Премиум-подписки:</span>
                      <span className="font-medium">84,500 ₽</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Итого:</span>
                      <span className="text-green-600">234,500 ₽</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Текущий месяц</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Доход:</span>
                      <span className="font-medium">45,200 ₽</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Расходы:</span>
                      <span className="font-medium">12,300 ₽</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Прибыль:</span>
                      <span className="text-green-600">32,900 ₽</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPage
