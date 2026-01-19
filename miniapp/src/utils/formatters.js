import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

export const formatPrice = (price) => {
  if (!price) return '0 ₽'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export const formatDate = (dateString) => {
  try {
    const date = parseISO(dateString)
    return format(date, 'dd MMMM yyyy', { locale: ru })
  } catch {
    return dateString
  }
}

export const formatRelativeTime = (dateString) => {
  try {
    const date = parseISO(dateString)
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: ru 
    })
  } catch {
    return dateString
  }
}

export const formatShortDate = (dateString) => {
  try {
    const date = parseISO(dateString)
    const now = new Date()
    const diffInDays = (now - date) / (1000 * 60 * 60 * 24)
    
    if (diffInDays < 1) {
      return format(date, 'HH:mm', { locale: ru })
    } else if (diffInDays < 7) {
      return format(date, 'EEEE', { locale: ru })
    } else {
      return format(date, 'dd MMM', { locale: ru })
    }
  } catch {
    return dateString
  }
}

export const truncateText = (text, maxLength) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const throttle = (func, limit) => {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
