import { Outlet } from 'react-router-dom'
import BottomNavigation from './BottomNavigation'
import { Helmet } from 'react-helmet-async'

const Layout = () => {
  return (
    <>
      <Helmet>
        <title>Lavka26 - Маркетплейс в Telegram</title>
        <meta name="description" content="Покупайте и продавайте товары прямо в Telegram" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 telegram-webapp">
        <main className="pb-20 safe-area-bottom">
          <Outlet />
        </main>
        
        <BottomNavigation />
      </div>
    </>
  )
}

export default Layout
