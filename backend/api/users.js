const { createClient } = '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    if (req.method === 'GET') {
      const { telegram_id } = req.query

      if (telegram_id) {
        // Получить профиль пользователя
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_id', telegram_id)
          .single()

        if (error && error.code !== 'PGRST116') {
          return res.status(500).json({ error: error.message })
        }

        return res.status(200).json({ user: data })
      } else {
        // Получить всех пользователей
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .limit(50)

        if (error) {
          return res.status(500).json({ error: error.message })
        }

        return res.status(200).json({ users: data || [] })
      }
    }

    if (req.method === 'POST') {
      // Создать или обновить пользователя
      const userData = req.body
      const { data, error } = await supabase
        .from('users')
        .upsert(userData, {
          onConflict: 'telegram_id'
        })
        .select()

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.status(201).json({ user: data[0] })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
