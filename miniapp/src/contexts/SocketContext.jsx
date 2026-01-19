import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const { token } = useAuth()

  useEffect(() => {
    if (!token) return

    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      auth: {
        token
      }
    })

    newSocket.on('connect', () => {
      console.log('Connected to server')
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server')
      setConnected(false)
    })

    newSocket.on('error', (error) => {
      console.error('Socket error:', error)
      toast.error('Ошибка соединения')
    })

    newSocket.on('new_message', (message) => {
      toast.success('Новое сообщение!')
    })

    newSocket.on('user_typing', ({ userId, typing }) => {
      // Handle typing indicators
      console.log(`User ${userId} is ${typing ? 'typing' : 'not typing'}`)
    })

    newSocket.on('messages_marked_read', (messageIds) => {
      // Handle messages marked as read
      console.log('Messages marked as read:', messageIds)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [token])

  const joinChat = (chatId) => {
    if (socket && connected) {
      socket.emit('join_chat', chatId)
    }
  }

  const sendMessage = (chatId, text, imageUrl = null) => {
    return new Promise((resolve, reject) => {
      if (!socket || !connected) {
        reject(new Error('Not connected to server'))
        return
      }

      socket.emit('send_message', { chatId, text, imageUrl }, (response) => {
        if (response?.error) {
          reject(new Error(response.error))
        } else {
          resolve(response)
        }
      })
    })
  }

  const markAsRead = (messageIds) => {
    if (socket && connected) {
      socket.emit('mark_read', messageIds)
    }
  }

  const startTyping = (chatId) => {
    if (socket && connected) {
      socket.emit('typing_start', chatId)
    }
  }

  const stopTyping = (chatId) => {
    if (socket && connected) {
      socket.emit('typing_stop', chatId)
    }
  }

  const value = {
    socket,
    connected,
    joinChat,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
