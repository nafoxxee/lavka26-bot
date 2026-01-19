import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Upload, X, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import api from '../utils/api'
import toast from 'react-hot-toast'

const EditAdPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [newImages, setNewImages] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue } = useForm()

  const { data: ad, isLoading } = useQuery({
    queryKey: ['ad', id],
    queryFn: async () => {
      const response = await api.get(`/ads/${id}`)
      return response.data
    },
    onSuccess: (data) => {
      // Set form values
      setValue('title', data.title)
      setValue('description', data.description)
      setValue('price', data.price)
      setValue('categoryId', data.category_id)
      setValue('location', data.location || '')
    }
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/ads/categories')
      return response.data
    }
  })

  const updateAdMutation = useMutation({
    mutationFn: async (data) => {
      const formData = new FormData()
      
      // Add form data
      formData.append('data', JSON.stringify({
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        categoryId: data.categoryId,
        location: data.location
      }))

      // Add new images
      newImages.forEach((image) => {
        formData.append('images', image)
      })

      const response = await api.put(`/ads/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ad', id])
      queryClient.invalidateQueries(['ads'])
      queryClient.invalidateQueries(['my-ads'])
      toast.success('Объявление обновлено')
      navigate(`/ad/${id}`)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Ошибка обновления объявления')
    }
  })

  const deleteImageMutation = useMutation({
    mutationFn: async (imageIndex) => {
      await api.delete(`/ads/${id}/images/${imageIndex}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ad', id])
      toast.success('Фото удалено')
    },
    onError: () => {
      toast.error('Ошибка удаления фото')
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

    const totalImages = (ad?.images?.length || 0) + newImages.length + validFiles.length
    if (totalImages > 10) {
      toast.error('Максимум 10 фотографий')
      return
    }

    setNewImages(prev => [...prev, ...validFiles])
  }

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (imageIndex) => {
    if (window.confirm('Удалить это фото?')) {
      deleteImageMutation.mutate(imageIndex)
    }
  }

  const onSubmit = (data) => {
    setIsSubmitting(true)
    updateAdMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="skeleton h-8 w-48 mb-6"></div>
          <div className="space-y-4">
            <div className="skeleton h-10 w-full"></div>
            <div className="skeleton h-32 w-full"></div>
            <div className="skeleton h-10 w-full"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!ad) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Объявление не найдено</p>
          <button onClick={() => navigate('/profile')} className="btn btn-primary">
            Вернуться в профиль
          </button>
        </div>
      </div>
    )
  }

  // Check if user can edit this ad
  if (ad.status === 'active' || ad.status === 'blocked') {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">
            Это объявление нельзя редактировать
          </p>
          <button onClick={() => navigate(`/ad/${id}`)} className="btn btn-primary">
            Вернуться к объявлению
          </button>
        </div>
      </div>
    )
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
        <h1 className="text-2xl font-bold text-gray-900">Редактировать объявление</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Existing Images */}
        {ad.images && ad.images.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Текущие фотографии
            </label>
            <div className="grid grid-cols-3 gap-3">
              {ad.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Existing ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Images */}
        {newImages.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Новые фотографии
            </label>
            <div className="grid grid-cols-3 gap-3">
              {newImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`New ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add More Images */}
        {(ad.images?.length || 0) + newImages.length < 10 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Добавить фотографии
            </label>
            <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-gray-400 transition-colors inline-block">
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
          </div>
        )}

        {/* Form Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Заголовок *
          </label>
          <input
            type="text"
            className={`input ${errors.title ? 'border-red-500' : ''}`}
            defaultValue={ad.title}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Категория *
          </label>
          <select
            className={`input ${errors.categoryId ? 'border-red-500' : ''}`}
            defaultValue={ad.category_id}
            {...register('categoryId', { required: 'Выберите категорию' })}
          >
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Цена (₽) *
          </label>
          <input
            type="number"
            className={`input ${errors.price ? 'border-red-500' : ''}`}
            defaultValue={ad.price}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Описание *
          </label>
          <textarea
            className={`input h-32 resize-none ${errors.description ? 'border-red-500' : ''}`}
            defaultValue={ad.description}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Местоположение
          </label>
          <input
            type="text"
            className="input"
            defaultValue={ad.location || ''}
            {...register('location')}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || updateAdMutation.isLoading}
          className="btn btn-primary w-full"
        >
          {isSubmitting || updateAdMutation.isLoading ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </form>
    </div>
  )
}

export default EditAdPage
