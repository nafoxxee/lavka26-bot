import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import AdCard from '../components/AdCard'
import AdCardSkeleton from '../components/AdCardSkeleton'
import { debounce } from '../utils/formatters'
import api from '../utils/api'

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce search query
  const debouncedSearch = debounce((query) => {
    setDebouncedQuery(query)
  }, 500)

  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    debouncedSearch(query)
  }

  const { data: ads, isLoading, error } = useQuery({
    queryKey: ['search-ads', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return []
      
      const response = await api.get(`/ads?search=${encodeURIComponent(debouncedQuery)}&limit=50`)
      return response.data
    },
    enabled: debouncedQuery.trim().length > 0,
  })

  const clearSearch = () => {
    setSearchQuery('')
    setDebouncedQuery('')
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Поиск</h1>

      {/* Search Input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Поиск объявлений..."
          className="input pl-10 pr-10"
          value={searchQuery}
          onChange={handleSearchChange}
          autoFocus
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Search Results */}
      {debouncedQuery.trim() === 0 ? (
        <div className="text-center py-12">
          <Search className="text-gray-300 mx-auto mb-4" size={48} />
          <p className="text-gray-600 mb-2">Введите поисковый запрос</p>
          <p className="text-sm text-gray-500">
            Ищите по названию, описанию или категории
          </p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <AdCardSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Ошибка поиска</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Попробовать снова
          </button>
        </div>
      ) : ads?.length === 0 ? (
        <div className="text-center py-12">
          <Search className="text-gray-300 mx-auto mb-4" size={48} />
          <p className="text-gray-600 mb-2">Ничего не найдено</p>
          <p className="text-sm text-gray-500">
            Попробуйте изменить поисковый запрос
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-gray-600">
              Найдено объявлений: {ads?.length || 0}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ads?.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default SearchPage
