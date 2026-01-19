import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, User } from 'lucide-react'
import { formatRelativeTime, truncateText } from '../utils/formatters'
import api from '../utils/api'

const ChatsPage = () => {
  const { data: chats, isLoading, error } = useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const response = await api.get('/chats')
      return response.data
    }
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Чаты</h1>
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="card p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="skeleton w-12 h-12 rounded-full"></div>
                <div className="flex-1">
                  <div className="skeleton h-4 w-1/3 mb-2"></div>
                  <div className="skeleton h-3 w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Чаты</h1>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Ошибка загрузки чатов</p>
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
        <MessageCircle className="text-primary-600" size={28} />
        <h1 className="text-2xl font-bold text-gray-900">Чаты</h1>
        {chats && chats.length > 0 && (
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
            {chats.length}
          </span>
        )}
      </div>

      {/* Chats List */}
      {!chats || chats.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="text-gray-300 mx-auto mb-4" size={48} />
          <p className="text-gray-600 mb-2">У вас нет чатов</p>
          <p className="text-sm text-gray-500 mb-6">
            Начните общение с продавцами или покупателями
          </p>
          <a href="/feed" className="btn btn-primary">
            Найти объявления
          </a>
        </div>
      ) : (
        <div className="space-y-2">
          {chats.map((chat) => {
            const otherUser = chat.buyer_id === chat.buyer?.id ? chat.seller : chat.buyer
            const adImage = chat.ad?.images?.[0]
            
            return (
              <Link
                key={chat.id}
                to={`/chat/${chat.id}`}
                className="card p-4 hover:shadow-md transition-shadow block"
              >
                <div className="flex items-center gap-3">
                  {/* Ad Image */}
                  <div className="relative">
                    {adImage ? (
                      <img
                        src={adImage}
                        alt={chat.ad?.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <User size={20} className="text-gray-400" />
                      </div>
                    )}
                    
                    {/* Unread indicator */}
                    {chat.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                      </div>
                    )}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {otherUser?.first_name || otherUser?.username || 'Пользователь'}
                      </h3>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {formatRelativeTime(chat.updated_at)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate mb-1">
                      {truncateText(chat.ad?.title || 'Объявление', 30)}
                    </p>
                    
                    {chat.last_message && (
                      <p className="text-sm text-gray-500 truncate">
                        {chat.last_message.sender?.username}: {truncateText(chat.last_message.text, 40)}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ChatsPage
