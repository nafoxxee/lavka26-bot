import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import FeedPage from './pages/FeedPage'
import SearchPage from './pages/SearchPage'
import FavoritesPage from './pages/FavoritesPage'
import ChatsPage from './pages/ChatsPage'
import ProfilePage from './pages/ProfilePage'
import CreateAdPage from './pages/CreateAdPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/create-ad" element={<CreateAdPage />} />
      </Routes>
    </Layout>
  )
}

export default App
