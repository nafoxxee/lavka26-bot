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
    console.log('🔍 AuthContext: Initializing...')
    
    // Always use fallback user for testing
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
    console.log('✅ AuthContext: Fallback user set:', fallbackUser)
    setLoading(false)
    console.log('🔍 AuthContext: Initialization complete')
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
    loading,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
