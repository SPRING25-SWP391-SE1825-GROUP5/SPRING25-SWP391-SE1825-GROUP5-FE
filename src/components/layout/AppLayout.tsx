import { Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import AppHeader from './AppHeader'

import { Footer } from '@/components/common'

import { ChatWidget } from '@/components/chat'

import './AppLayout.scss'

export default function AppLayout() {
  const user = useAppSelector((s) => s.auth.user)
  const hasEmailBanner = user && !user.emailVerified
  const location = useLocation()
  
  // Hide ChatWidget on contact page (full chat interface)
  const isContactPage = location.pathname === '/contact'

  return (
    <div className="app-layout">
      <AppHeader />
      <main className={`main-content ${hasEmailBanner ? 'has-email-banner' : ''}`}>
        <Outlet />
      </main>
      <Footer />
      
      {/* Chat Widget - Only show for authenticated users and NOT on contact page */}
      {user && !isContactPage && (
        <ChatWidget 
          position="bottom-right"
          theme="light"
        />
      )}

    </div>
  )
}

