import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, X, Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext-test'

const CreateAdPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'electronics',
    images: []
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const categories = [
    { id: 'electronics', name: 'Электроника' },
    { id: 'clothing', name: 'Одежда' },
    { id: 'home', name: 'Дом' },
    { id: 'auto', name: 'Авто' },
    { id: 'services', name: 'Услуги' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description || !formData.price) {
      setError('Заполните все поля')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      // Здесь будет отправка в Supabase
      console.log('Creating ad:', formData)
      
      // Временная заглушка
      setTimeout(() => {
        navigate('/feed')
      }, 1000)
      
    } catch (error) {
      setError('Ошибка при создании объявления')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }))
  }

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold ml-3">Создать объявление</h1>
        </div>
      </div>

      <div className="p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Фотографии
            </label>
            <div className="grid grid-cols-3 gap-2">
              {formData.images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              {formData.images.length < 5 && (
                <label className="border-2 border-dashed border-gray-300 rounded-lg h-24 flex items-center justify-center cursor-pointer hover:border-gray-400">
                  <Camera size={20} className="text-gray-400" />
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Например: iPhone 13 Pro"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Опишите ваш товар..."
              required
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Цена (₽) *
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1000"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Категория *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Создание...' : 'Создать объявление'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateAdPage
