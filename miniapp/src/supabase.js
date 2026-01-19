import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Функции для работы с Supabase
export const supabaseService = {
  // Получить объявления
  async getAds() {
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error getting ads:', error)
      return { ads: [], error }
    }
    
    return { ads: data || [], error: null }
  },

  // Создать объявление
  async createAd(adData) {
    const { data, error } = await supabase
      .from('ads')
      .insert([adData])
      .select()
    
    if (error) {
      console.error('Error creating ad:', error)
      return { ad: null, error }
    }
    
    return { ad: data[0], error: null }
  },

  // Получить профиль пользователя
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', userId)
      .single()
    
    if (error) {
      console.error('Error getting user profile:', error)
      return { user: null, error }
    }
    
    return { user: data, error: null }
  },

  // Обновить профиль пользователя
  async updateUserProfile(userId, updateData) {
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('telegram_id', userId)
      .select()
    
    if (error) {
      console.error('Error updating user:', error)
      return { user: null, error }
    }
    
    return { user: data[0], error: null }
  }
}
