import { createContext, useContext, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../utils/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize Telegram WebApp
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const webApp = window.Telegram.WebApp
      webApp.ready()
      webApp.expand()
      webApp.enableClosingConfirmation()
      
      // Set theme colors
      if (webApp.themeParams) {
        document.documentElement.style.setProperty(
          '--tg-theme-bg-color',
          webApp.themeParams.bg_color || '#ffffff'
        )
        document.documentElement.style.setProperty(
          '--tg-theme-text-color',
          webApp.themeParams.text_color || '#000000'
        )
        document.documentElement.style.setProperty(
          '--tg-theme-button-color',
          webApp.themeParams.button_color || '#3b82f6'
        )
        document.documentElement.style.setProperty(
          '--tg-theme-button-text-color',
          webApp.themeParams.button_text_color || '#ffffff'
        )
      }
    }
  }, [])

  // Login with Telegram
  const login = async (initData) => {
    try {
      const response = await api.post('/auth/telegram', { initData })
      const { token: newToken, user: userData } = response.data
      
      setToken(newToken)
      setUser(userData)
      localStorage.setItem('token', newToken)
      
      toast.success('Добро пожаловать в Lavka26!')
      return true
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Ошибка авторизации')
      return false
    }
  }

  // Logout
  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    toast.success('Вы вышли из системы')
  }

  // Get user profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      if (!token) return null
      
      try {
        const response = await api.get('/users/profile')
        return response.data
      } catch (error) {
        if (error.response?.status === 401) {
          logout()
        }
        throw error
      }
    },
    enabled: !!token,
    retry: false,
  })

  // Update user state when profile data changes
  useEffect(() => {
    if (profileData) {
      setUser(profileData)
    }
    setLoading(false)
  }, [profileData])

  // Auto-login with Telegram WebApp
  useEffect(() => {
    if (!token && window.Telegram && window.Telegram.WebApp) {
      const webApp = window.Telegram.WebApp
      if (webApp.initData) {
        login(webApp.initData)
      }
    } else if (!token) {
      setLoading(false)
    }
  }, [token])

  const value = {
    user,
    token,
    loading: loading || profileLoading,
    login,
    logout,
    isAdmin: user?.isAdmin || false,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
