import { Outlet } from 'react-router-dom'
import AppHeader from './AppHeader'
import { AppFooter } from './AppFooter'
import './AppLayout.scss'

export default function AppLayout() {
  return (
    <div className="app-layout">
      <AppHeader />
      <main className="main-content">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  )
}

