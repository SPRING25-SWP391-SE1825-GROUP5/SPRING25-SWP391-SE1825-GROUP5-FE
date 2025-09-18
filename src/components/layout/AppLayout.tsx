import { Outlet } from 'react-router-dom'
import NewAppHeader from './NewAppHeader'
import { AppFooter } from './AppFooter'
import './AppLayout.scss'

export default function AppLayout() {
  return (
    <div className="app-layout">
      <NewAppHeader />
      <main className="main-content">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  )
}

