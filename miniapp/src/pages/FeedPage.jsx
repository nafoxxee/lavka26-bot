import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import InfiniteScroll from 'react-infinite-scroll-component'
import AdCard from '../components/AdCard'
import AdCardSkeleton from '../components/AdCardSkeleton'
import FilterButton from '../components/FilterButton'
import { Search, Filter } from 'lucide-react'
import api from '../utils/api'

const FeedPage = () => {
  const [filters, setFilters] = useState({})
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(0)

  const { data, isLoading, error, fetchNextPage, hasNextPage } = useQuery({
    queryKey: ['ads', filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: '20',
        offset: page * 20,
        ...filters
      })
      
      const response = await api.get(`/ads?${params}`)
      return response.data
    },
    keepPreviousData: true,
  })

  const ads = data || []

  const loadMore = () => {
    if (hasNextPage) {
      setPage(prev => prev + 1)
      fetchNextPage()
    }
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setPage(0)
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Ошибка загрузки объявлений</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Лента</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Filter size={20} />
            Фильтры
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Поиск объявлений..."
          className="input pl-10"
          value={filters.search || ''}
          onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <FilterButton 
          filters={filters} 
          onFilterChange={handleFilterChange}
        />
      )}

      {/* Ads Grid */}
      {isLoading && ads.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <AdCardSkeleton key={index} />
          ))}
        </div>
      ) : ads.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Объявления не найдены</p>
          <button
            onClick={() => handleFilterChange({})}
            className="btn btn-secondary"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <InfiniteScroll
          dataLength={ads.length}
          next={loadMore}
          hasMore={hasNextPage}
          loader={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {[...Array(3)].map((_, index) => (
                <AdCardSkeleton key={index} />
              ))}
            </div>
          }
          endMessage={
            <p className="text-center text-gray-600 mt-8">
              Больше объявлений нет
            </p>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        </InfiniteScroll>
      )}
    </div>
  )
}

export default FeedPage
