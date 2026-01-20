import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext-test'
import { Loader2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const LoginPage = () => {
  const { login } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const authenticate = async () => {
      try {
        if (window.Telegram && window.Telegram.WebApp) {
          const webApp = window.Telegram.WebApp
          
          if (!webApp.initData) {
            setError('Откройте приложение через Telegram бота')
            setLoading(false)
            return
          }

          const success = await login(webApp.initData)
          if (!success) {
            setError('Ошибка авторизации. Попробуйте снова.')
          }
        } else {
          setError('Это приложение работает только в Telegram')
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ошибка</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary w-full"
          >
            Попробовать снова
          </button>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Как открыть приложение:</strong><br />
              1. Найдите бота @lavka26_bot в Telegram<br />
              2. Нажмите /start<br />
              3. Нажмите кнопку "Открыть Lavka26"
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="animate-spin text-primary-600 mx-auto mb-4" size={48} />
        <p className="text-gray-600">Перенаправление в приложение...</p>
      </div>
    </div>
  )
}

export default LoginPage
