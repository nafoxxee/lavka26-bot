import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { 
  Home, 
  Search, 
  Heart, 
  MessageCircle, 
  User, 
  Plus
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext-test'

const BottomNavigation = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const navItems = [
    {
      name: 'Лента',
      path: '/feed',
      icon: Home,
    },
    {
      name: 'Поиск',
      path: '/search',
      icon: Search,
    },
    {
      name: 'Создать',
      path: '/create-ad',
      icon: Plus,
    },
    {
      name: 'Избранное',
      path: '/favorites',
      icon: Heart,
    },
    {
      name: 'Профиль',
      path: '/profile',
      icon: User,
    },
  ]

  const handleNavClick = (path) => {
    navigate(path)
  }

  const isActive = (path) => {
    if (path === '/feed') {
      return location.pathname === '/' || location.pathname === '/feed'
    }
    return location.pathname === path
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          
          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                active
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs font-medium">{item.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default BottomNavigation
