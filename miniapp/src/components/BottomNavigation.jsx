import { NavLink, useLocation } from 'react-router-dom'
import { 
  Home, 
  Search, 
  Heart, 
  MessageCircle, 
  User, 
  Plus
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const BottomNavigation = () => {
  const location = useLocation()
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
      special: true,
    },
    {
      name: 'Избранное',
      path: '/favorites',
      icon: Heart,
    },
    {
      name: 'Чаты',
      path: '/chats',
      icon: MessageCircle,
    },
    {
      name: 'Профиль',
      path: '/profile',
      icon: User,
    },
  ]

  const isActive = (path) => {
    if (path === '/feed') {
      return location.pathname === '/' || location.pathname === '/feed'
    }
    return location.pathname === path
  }

  return (
    <nav className="bottom-nav safe-area-bottom">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`
                flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all
                ${item.special 
                  ? 'bg-primary-600 text-white shadow-lg scale-110' 
                  : active 
                    ? 'text-primary-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              <Icon 
                size={item.special ? 28 : 24} 
                className={item.special ? 'animate-pulse' : ''}
              />
              <span 
                className={`
                  text-xs mt-1 font-medium
                  ${item.special ? 'text-white' : ''}
                `}
              >
                {item.name}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNavigation
