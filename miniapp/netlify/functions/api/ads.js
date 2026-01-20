import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export async function handler(event, context) {
  const { httpMethod, body } = event

  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  }

  // Handle OPTIONS request
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    }
  }

  try {
    switch (httpMethod) {
      case 'GET':
        const { data, error } = await supabase
          .from('ads')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ ads: data })
        }

      case 'POST':
        const adData = JSON.parse(body)
        const { data: newAd, error: createError } = await supabase
          .from('ads')
          .insert([adData])
          .select()
        
        if (createError) throw createError
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ ad: newAd[0] })
        }

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        }
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}
