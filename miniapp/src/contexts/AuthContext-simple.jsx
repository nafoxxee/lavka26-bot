import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
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

      // Auto-login with Telegram data
      const userData = webApp.initDataUnsafe?.user
      if (userData) {
        login(userData)
      }
    }
    setLoading(false)
  }, [])

  const login = async (telegramData) => {
    try {
      // Create or get user from Supabase
      const { data, error } = await supabase
        .from('users')
        .upsert({
          telegram_id: telegramData.id,
          username: telegramData.username,
          first_name: telegramData.first_name,
          last_name: telegramData.last_name,
          photo_url: telegramData.photo_url,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Login error:', error)
        return false
      }

      setUser(data)
      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
  }

  const value = {
    user,
    login,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
