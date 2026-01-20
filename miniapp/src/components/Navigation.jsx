import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Search, Heart, MessageCircle, User } from 'lucide-react'

const Navigation = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { path: '/feed', icon: Home, label: 'Лента' },
    { path: '/search', icon: Search, label: 'Поиск' },
    { path: '/favorites', icon: Heart, label: 'Избранное' },
    { path: '/chats', icon: MessageCircle, label: 'Чаты' },
    { path: '/profile', icon: User, label: 'Профиль' }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center p-2 transition-colors ${
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default Navigation
