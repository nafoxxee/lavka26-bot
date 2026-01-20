import { createContext, useContext, useEffect, useState } from 'react'

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

      // Get user data from Telegram
      const userData = webApp.initDataUnsafe?.user
      
      if (userData) {
        // Create user object from Telegram data
        const user = {
          id: userData.id,
          telegram_id: userData.id,
          username: userData.username || `user_${userData.id}`,
          first_name: userData.first_name || 'User',
          last_name: userData.last_name || '',
          photo_url: userData.photo_url || '',
          created_at: new Date().toISOString()
        }
        
        setUser(user)
        console.log('✅ User authenticated:', user)
      } else {
        // Fallback for testing
        console.log('⚠️ No Telegram user data, using fallback')
        const fallbackUser = {
          id: 12345,
          telegram_id: 12345,
          username: 'test_user',
          first_name: 'Test',
          last_name: 'User',
          photo_url: '',
          created_at: new Date().toISOString()
        }
        setUser(fallbackUser)
      }
    } else {
      // Fallback for local testing
      console.log('⚠️ No Telegram WebApp, using fallback')
      const fallbackUser = {
        id: 12345,
        telegram_id: 12345,
        username: 'test_user',
        first_name: 'Test',
        last_name: 'User',
        photo_url: '',
        created_at: new Date().toISOString()
      }
      setUser(fallbackUser)
    }
    
    setLoading(false)
  }, [])

  const login = async (telegramData) => {
    setUser(telegramData)
    return true
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
