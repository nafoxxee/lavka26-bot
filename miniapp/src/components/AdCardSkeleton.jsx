const AdCardSkeleton = () => {
  return (
    <div className="card overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="skeleton h-48 w-full"></div>
      
      {/* Content skeleton */}
      <div className="p-4">
        {/* Title skeleton */}
        <div className="skeleton h-6 w-3/4 mb-2"></div>
        
        {/* Description skeleton */}
        <div className="skeleton h-4 w-full mb-1"></div>
        <div className="skeleton h-4 w-2/3 mb-3"></div>
        
        {/* Price skeleton */}
        <div className="skeleton h-8 w-1/2 mb-3"></div>
        
        {/* Footer skeleton */}
        <div className="flex justify-between">
          <div className="skeleton h-4 w-16"></div>
          <div className="skeleton h-4 w-20"></div>
        </div>
      </div>
    </div>
  )
}

export default AdCardSkeleton
