import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { getCurrentUser } from '@/store/authSlice'
import AppHeader from './AppHeader'

import { Footer } from '@/components/common'

import { ChatWidget } from '@/components/chat'

import './AppLayout.scss'

export default function AppLayout() {
  const user = useAppSelector((s) => s.auth.user)
  const token = useAppSelector((s) => s.auth.token)
  const dispatch = useAppDispatch()
  const hasEmailBanner = user && !user.emailVerified
  const location = useLocation()
  
  useEffect(() => {
    const fetchCustomerIdIfNeeded = async () => {
      if (token && user && !user.customerId) {
        try {
          await dispatch(getCurrentUser()).unwrap()
        } catch (error) {
          // Silently fail
        }
      }
    }

    fetchCustomerIdIfNeeded()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
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

