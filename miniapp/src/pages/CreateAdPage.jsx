import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, X, Image as ImageIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import api from '../utils/api'
import toast from 'react-hot-toast'

const CreateAdPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [images, setImages] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch } = useForm()

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/ads/categories')
      return response.data
    }
  })

  const createAdMutation = useMutation({
    mutationFn: async (data) => {
      const formData = new FormData()
      
      // Add form data
      formData.append('data', JSON.stringify({
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        categoryId: data.categoryId,
        location: data.location,
        contactInfo: data.contactInfo ? JSON.parse(data.contactInfo) : null
      }))

      // Add images
      images.forEach((image, index) => {
        formData.append('images', image)
      })

      const response = await api.post('/ads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ads'])
      queryClient.invalidateQueries(['my-ads'])
      toast.success('Объявление создано и отправлено на модерацию')
      navigate('/profile')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка создания объявления')
    }
  })

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
      const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB
      
      if (!isValidType) {
        toast.error(`Файл ${file.name} имеет неподдерживаемый формат`)
        return false
      }
      if (!isValidSize) {
        toast.error(`Файл ${file.name} слишком большой (макс. 5MB)`)
        return false
      }
      return true
    })

    setImages(prev => [...prev, ...validFiles].slice(0, 10)) // Max 10 images
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = (data) => {
    if (images.length === 0) {
      toast.error('Добавьте хотя бы одно фото')
      return
    }

    setIsSubmitting(true)
    createAdMutation.mutate(data)
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Создать объявление</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Фотографии (макс. 10)
          </label>
          
          <div className="grid grid-cols-3 gap-3">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            
            {images.length < 10 && (
              <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="text-center">
                  <Upload className="mx-auto text-gray-400 mb-1" size={20} />
                  <span className="text-xs text-gray-600">Добавить фото</span>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Заголовок *
          </label>
          <input
            type="text"
            className={`input ${errors.title ? 'border-red-500' : ''}`}
            placeholder="Например: iPhone 13 Pro 256GB"
            {...register('title', { 
              required: 'Заголовок обязателен',
              minLength: { value: 3, message: 'Минимум 3 символа' },
              maxLength: { value: 255, message: 'Максимум 255 символов' }
            })}
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Категория *
          </label>
          <select
            className={`input ${errors.categoryId ? 'border-red-500' : ''}`}
            {...register('categoryId', { required: 'Выберите категорию' })}
          >
            <option value="">Выберите категорию</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="text-red-500 text-sm mt-1">{errors.categoryId.message}</p>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Цена (₽) *
          </label>
          <input
            type="number"
            className={`input ${errors.price ? 'border-red-500' : ''}`}
            placeholder="0"
            min="0"
            step="0.01"
            {...register('price', { 
              required: 'Цена обязательна',
              min: { value: 0, message: 'Цена не может быть отрицательной' }
            })}
          />
          {errors.price && (
            <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Описание *
          </label>
          <textarea
            className={`input h-32 resize-none ${errors.description ? 'border-red-500' : ''}`}
            placeholder="Опишите товар подробно..."
            {...register('description', { 
              required: 'Описание обязательно',
              minLength: { value: 10, message: 'Минимум 10 символов' },
              maxLength: { value: 5000, message: 'Максимум 5000 символов' }
            })}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Местоположение
          </label>
          <input
            type="text"
            className="input"
            placeholder="Москва, Центральный район"
            {...register('location')}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || createAdMutation.isLoading}
          className="btn btn-primary w-full"
        >
          {isSubmitting || createAdMutation.isLoading ? 'Создание...' : 'Создать объявление'}
        </button>
      </form>
    </div>
  )
}

export default CreateAdPage
