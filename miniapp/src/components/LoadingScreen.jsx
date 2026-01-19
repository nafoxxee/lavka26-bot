import { Loader2 } from 'lucide-react'

const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="animate-spin text-primary-600 mx-auto mb-4" size={48} />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Lavka26</h2>
        <p className="text-gray-600">Загрузка...</p>
      </div>
    </div>
  )
}

export default LoadingScreen
