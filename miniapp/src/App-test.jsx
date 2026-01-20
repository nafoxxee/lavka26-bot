import React, { useState, useEffect } from 'react'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
      const webApp = window.Telegram.WebApp
      webApp.ready()
      webApp.expand()
      
      console.log('✅ Telegram WebApp initialized')
      
      // Get user data
      const userData = webApp.initDataUnsafe?.user
      
      if (userData) {
        setUser(userData)
        console.log('✅ User found:', userData)
      } else {
        // Fallback user
        setUser({
          id: 12345,
          first_name: 'Test',
          last_name: 'User'
        })
        console.log('✅ Using fallback user')
      }
    } else {
      // Fallback for local testing
      setUser({
        id: 12345,
        first_name: 'Test',
        last_name: 'User'
      })
      console.log('✅ No Telegram, using fallback')
    }
    
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f3f4f6'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>🛍️</div>
          <h2 style={{ margin: 0, color: '#1f2937' }}>Lavka26</h2>
          <p style={{ margin: '8px 0 0 0', color: '#6b7280' }}>Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '16px'
    }}>
      <div style={{ 
        maxWidth: '400px', 
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          color: '#1f2937'
        }}>
          🛍️ Lavka26
        </h1>
        
        <div style={{ 
          backgroundColor: '#f3f4f6',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Привет, {user.first_name}! 👋
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}>
            📦 Мои объявления
          </button>
          
          <button style={{
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}>
            ➕ Создать объявление
          </button>
          
          <button style={{
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}>
            💬 Чаты
          </button>
          
          <button style={{
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}>
            👤 Профиль
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
