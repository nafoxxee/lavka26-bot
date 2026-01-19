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
      // Получить объявления
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json({ ads: data || [] })
    }

    if (req.method === 'POST') {
      // Создать объявление
      const adData = req.body
      const { data, error } = await supabase
        .from('ads')
        .insert([adData])
        .select()

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.status(201).json({ ad: data[0] })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
