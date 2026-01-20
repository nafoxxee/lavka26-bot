import React, { useState, useEffect } from 'react'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('home')

  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
      const webApp = window.Telegram.WebApp
      webApp.ready()
      webApp.expand()
      
      // Set theme colors
      if (webApp.themeParams) {
        document.documentElement.style.setProperty(
          '--tg-theme-bg-color',
          webApp.themeParams.bg_color || '#ffffff'
        )
        document.documentElement.style.setProperty(
          '--tg-theme-text-color',
          webApp.themeParams.text_color || '#000000'
        )
        document.documentElement.style.setProperty(
          '--tg-theme-button-color',
          webApp.themeParams.button_color || '#3b82f6'
        )
      }
      
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
          last_name: 'User',
          username: 'test_user'
        })
        console.log('✅ Using fallback user')
      }
    } else {
      // Fallback for local testing
      setUser({
        id: 12345,
        first_name: 'Test',
        last_name: 'User',
        username: 'test_user'
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
        backgroundColor: 'var(--tg-theme-bg-color, #f3f4f6)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🛍️</div>
          <h2 style={{ margin: 0, color: 'var(--tg-theme-text-color, #1f2937)' }}>Lavka26</h2>
          <p style={{ margin: '8px 0 0 0', color: '#6b7280' }}>Загрузка...</p>
        </div>
      </div>
    )
  }

  const HomePage = () => (
    <div style={{ padding: '16px' }}>
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          marginBottom: '8px',
          color: 'var(--tg-theme-text-color, #1f2937)'
        }}>
          🛍️ Lavka26
        </h1>
        <p style={{ 
          color: '#6b7280',
          fontSize: '16px',
          marginBottom: '20px'
        }}>
          Маркетплейс для покупки и продажи товаров
        </p>
        
        <div style={{ 
          backgroundColor: '#f3f4f6',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <p style={{ margin: 0, color: '#374151', fontSize: '16px' }}>
            👋 Привет, <strong>{user.first_name}!</strong>
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={() => setCurrentPage('feed')} style={{
            backgroundColor: 'var(--tg-theme-button-color, #3b82f6)',
            color: 'white',
            border: 'none',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            📦 Объявления
          </button>
          
          <button onClick={() => setCurrentPage('create')} style={{
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            ➕ Создать объявление
          </button>
          
          <button onClick={() => setCurrentPage('chats')} style={{
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            💬 Чаты
          </button>
          
          <button onClick={() => setCurrentPage('profile')} style={{
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            👤 Профиль
          </button>
        </div>
      </div>
    </div>
  )

  const FeedPage = () => (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '16px' }}>
        <button 
          onClick={() => setCurrentPage('home')}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #d1d5db',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          ← Назад
        </button>
      </div>
      
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>📦 Объявления</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Товар {i}</h3>
            <p style={{ margin: '0 0 8px 0', color: '#6b7280' }}>Описание товара {i}</p>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#059669' }}>
              ${100 * i}
            </p>
          </div>
        ))}
      </div>
    </div>
  )

  const CreatePage = () => (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '16px' }}>
        <button 
          onClick={() => setCurrentPage('home')}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #d1d5db',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          ← Назад
        </button>
      </div>
      
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>➕ Создать объявление</h2>
      
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <p style={{ textAlign: 'center', color: '#6b7280' }}>
          Форма создания объявления будет здесь
        </p>
      </div>
    </div>
  )

  const ChatsPage = () => (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '16px' }}>
        <button 
          onClick={() => setCurrentPage('home')}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #d1d5db',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          ← Назад
        </button>
      </div>
      
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>💬 Чаты</h2>
      
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <p style={{ textAlign: 'center', color: '#6b7280' }}>
          Список чатов будет здесь
        </p>
      </div>
    </div>
  )

  const ProfilePage = () => (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '16px' }}>
        <button 
          onClick={() => setCurrentPage('home')}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #d1d5db',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          ← Назад
        </button>
      </div>
      
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>👤 Профиль</h2>
      
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#e5e7eb',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '32px'
          }}>
            👤
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>
            {user.first_name} {user.last_name}
          </h3>
          <p style={{ margin: 0, color: '#6b7280' }}>
            @{user.username || 'username'}
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Мои объявления</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 'bold' }}>0</p>
          </div>
          <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Чаты</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 'bold' }}>0</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPage = () => {
    switch(currentPage) {
      case 'feed': return <FeedPage />
      case 'create': return <CreatePage />
      case 'chats': return <ChatsPage />
      case 'profile': return <ProfilePage />
      default: return <HomePage />
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: 'var(--tg-theme-bg-color, #f9fafb)'
    }}>
      {renderPage()}
    </div>
  )
}

export default App
