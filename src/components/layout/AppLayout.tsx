import { Outlet } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import AppHeader from './AppHeader'
import { Footer } from '@/components/common'
import './AppLayout.scss'

export default function AppLayout() {
  const user = useAppSelector((s) => s.auth.user)
  const hasEmailBanner = user && !user.emailVerified

  return (
    <div className="app-layout">
      <AppHeader />
      <main className={`main-content ${hasEmailBanner ? 'has-email-banner' : ''}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

