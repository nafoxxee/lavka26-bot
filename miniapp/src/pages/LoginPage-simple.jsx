import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext-test'
import { Loader2, AlertCircle } from 'lucide-react'

const LoginPage = () => {
  const { login } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const authenticate = async () => {
      try {
        if (window.Telegram && window.Telegram.WebApp) {
          const webApp = window.Telegram.WebApp
          
          // Get user data directly from WebApp
          const userData = webApp.initDataUnsafe?.user
          
          if (userData) {
            console.log('✅ Telegram user found:', userData)
            const success = await login(userData)
            if (!success) {
              setError('Ошибка авторизации. Попробуйте снова.')
            }
          } else {
            console.log('⚠️ No Telegram user data, using fallback')
            // Use fallback user
            const fallbackUser = {
              id: 12345,
              telegram_id: 12345,
              username: 'test_user',
              first_name: 'Test',
              last_name: 'User',
              photo_url: '',
              created_at: new Date().toISOString()
            }
            const success = await login(fallbackUser)
            if (!success) {
              setError('Ошибка авторизации. Попробуйте снова.')
            }
          }
        } else {
          console.log('⚠️ No Telegram WebApp, using fallback')
          // Use fallback user for local testing
          const fallbackUser = {
            id: 12345,
            telegram_id: 12345,
            username: 'test_user',
            first_name: 'Test',
            last_name: 'User',
            photo_url: '',
            created_at: new Date().toISOString()
          }
          const success = await login(fallbackUser)
          if (!success) {
            setError('Ошибка авторизации. Попробуйте снова.')
          }
        }
      } catch (err) {
        console.error('Authentication error:', err)
        setError('Произошла ошибка при авторизации')
      } finally {
        setLoading(false)
      }
    }

    authenticate()
  }, [login])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-primary-600 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Lavka26</h2>
          <p className="text-gray-600">Авторизация...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ошибка</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  return null // Will redirect automatically when user is set
}

export default LoginPage
