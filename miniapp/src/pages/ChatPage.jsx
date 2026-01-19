import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Paperclip } from 'lucide-react'
import { useSocket } from '../contexts/SocketContext'
import { formatRelativeTime } from '../utils/formatters'
import api from '../utils/api'
import toast from 'react-hot-toast'

const ChatPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { socket, joinChat, sendMessage, markAsRead } = useSocket()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const messagesEndRef = useRef(null)

  const { data: chat, isLoading } = useQuery({
    queryKey: ['chat', id],
    queryFn: async () => {
      const response = await api.get(`/chats/${id}`)
      return response.data
    }
  })

  const { data: initialMessages } = useQuery({
    queryKey: ['chat-messages', id],
    queryFn: async () => {
      const response = await api.get(`/chats/${id}/messages`)
      return response.data
    },
    onSuccess: (data) => {
      setMessages(data.reverse())
      
      // Mark unread messages as read
      const unreadMessageIds = data
        .filter(msg => !msg.is_read && msg.sender_id !== chat?.buyer_id && msg.sender_id !== chat?.seller_id)
        .map(msg => msg.id)
      
      if (unreadMessageIds.length > 0) {
        markAsRead(unreadMessageIds)
      }
    }
  })

  const sendMessageMutation = useMutation({
    mutationFn: async (text) => {
      await sendMessage(id, text)
    },
    onError: (error) => {
      toast.error(error.message || 'Ошибка отправки сообщения')
    }
  })

  // Join chat room
  useEffect(() => {
    if (socket && id) {
      joinChat(id)
    }
  }, [socket, id, joinChat])

  // Listen for new messages
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (newMessage) => {
      if (newMessage.chat_id === id) {
        setMessages(prev => [...prev, newMessage])
        queryClient.invalidateQueries(['chats'])
      }
    }

    socket.on('new_message', handleNewMessage)
    return () => socket.off('new_message', handleNewMessage)
  }, [socket, id, queryClient])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e) => {
    e.preventDefault()
    
    if (!message.trim()) return
    
    const tempMessage = {
      id: Date.now(),
      text: message.trim(),
      sender_id: chat?.buyer_id || chat?.seller_id,
      created_at: new Date().toISOString(),
      temp: true
    }
    
    setMessages(prev => [...prev, tempMessage])
    sendMessageMutation.mutate(message.trim())
    setMessage('')
  }

  const otherUser = chat?.buyer_id === chat?.buyer?.id ? chat?.seller : chat?.buyer

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <div className="animate-pulse p-4 border-b">
          <div className="skeleton h-6 w-32"></div>
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="skeleton h-12 w-3/4"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!chat) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Чат не найден</p>
          <button onClick={() => navigate('/chats')} className="btn btn-primary">
            Вернуться к чатам
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/chats')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex-1">
            <div className="font-medium text-gray-900">
              {otherUser?.first_name || otherUser?.username || 'Пользователь'}
            </div>
            <div className="text-sm text-gray-500">
              {chat.ad?.title}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isOwn = msg.sender_id === (chat?.buyer_id || chat?.seller_id)
          
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`chat-message max-w-xs lg:max-w-md ${
                  isOwn ? 'chat-message-sent' : 'chat-message-received'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <div className={`text-xs mt-1 ${
                  isOwn ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatRelativeTime(msg.created_at)}
                  {msg.temp && ' (отправляется...)'}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <form onSubmit={handleSend} className="flex gap-2">
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <Paperclip size={20} />
          </button>
          
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Написать сообщение..."
            className="flex-1 input"
            disabled={sendMessageMutation.isLoading}
          />
          
          <button
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isLoading}
            className="btn btn-primary px-4"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatPage
