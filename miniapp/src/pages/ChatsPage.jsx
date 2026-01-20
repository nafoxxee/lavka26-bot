import React, { useState } from 'react'
import { MessageCircle, Search } from 'lucide-react'

const ChatsPage = () => {
  const [chats] = useState([
    {
      id: 1,
      title: 'iPhone 13 Pro',
      last_message: 'Здравствуйте, товар еще доступен?',
      time: '10:30',
      unread: 2,
      user: {
        first_name: 'Иван',
        last_name: 'Иванов',
        photo_url: ''
      }
    },
    {
      id: 2,
      title: 'Куртка зимняя',
      last_message: 'Можно посмотреть сегодня?',
      time: 'Вчера',
      unread: 0,
      user: {
        first_name: 'Мария',
        last_name: 'Петрова',
        photo_url: ''
      }
    }
  ])

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4">
          <h1 className="text-lg font-semibold mb-3">Чаты</h1>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Поиск чатов..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {chats.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет чатов</h3>
            <p className="text-gray-600">Начните общение с продавцами</p>
          </div>
        ) : (
          <div className="space-y-2">
            {chats.map((chat) => (
              <div key={chat.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    {chat.user.photo_url ? (
                      <img
                        src={chat.user.photo_url}
                        alt={chat.user.first_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <MessageCircle size={24} className="text-gray-500" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{chat.title}</h3>
                      <span className="text-xs text-gray-500">{chat.time}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">{chat.last_message}</p>
                      {chat.unread > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 ml-2">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatsPage
