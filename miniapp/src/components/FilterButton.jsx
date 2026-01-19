import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, ChevronDown } from 'lucide-react'
import api from '../utils/api'

const FilterButton = ({ filters, onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/ads/categories')
      return response.data
    }
  })

  const handleCategoryChange = (categoryId) => {
    const newFilters = { ...filters }
    if (categoryId === filters.categoryId) {
      delete newFilters.categoryId
    } else {
      newFilters.categoryId = categoryId
    }
    onFilterChange(newFilters)
  }

  const handlePriceChange = (type, value) => {
    const newFilters = { ...filters }
    if (value) {
      newFilters[type] = value
    } else {
      delete newFilters[type]
    }
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    onFilterChange({})
    setIsOpen(false)
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  return (
    <>
      {/* Filter Button */}
      <div className="mb-6">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`btn ${hasActiveFilters ? 'btn-primary' : 'btn-secondary'} w-full`}
        >
          Фильтры
          {hasActiveFilters && (
            <span className="ml-2 bg-white/20 px-2 py-1 rounded text-xs">
              {Object.keys(filters).length}
            </span>
          )}
          <ChevronDown className={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} size={16} />
        </button>
      </div>

      {/* Filter Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full max-h-[80vh] overflow-y-auto rounded-t-2xl animate-slide-up">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Фильтры</h2>
              <div className="flex gap-2">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="btn btn-secondary text-sm"
                  >
                    Сбросить
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Filter Content */}
            <div className="p-4 space-y-6">
              {/* Categories */}
              <div>
                <h3 className="font-medium mb-3">Категория</h3>
                <div className="grid grid-cols-2 gap-2">
                  {categories?.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        filters.categoryId === category.id
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span className="text-sm">{category.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="font-medium mb-3">Цена</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">От</label>
                    <input
                      type="number"
                      placeholder="0"
                      className="input"
                      value={filters.minPrice || ''}
                      onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">До</label>
                    <input
                      type="number"
                      placeholder="999999"
                      className="input"
                      value={filters.maxPrice || ''}
                      onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-primary w-full"
              >
                Применить фильтры
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default FilterButton
