import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/styles/color-theme.css'
import './styles/global.scss'
import './styles/scrollbar.scss'
import { AppRouter } from './router'
import { Provider } from 'react-redux'
import { store } from './store'
import { syncFromLocalStorage } from './store/authSlice'
import { Toaster } from 'react-hot-toast'
import LoginToastWatcher from '@/components/common/LoginToastWatcher'

// Sync authentication state from localStorage on app start
store.dispatch(syncFromLocalStorage())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <AppRouter />
      {/* Global login toast watcher */}
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      <LoginToastWatcher />
      <Toaster
        position="top-right"
        reverseOrder={false}
        containerStyle={{ zIndex: 2147483647, pointerEvents: 'none' }}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--gradient-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            fontFamily: "'Poppins', sans-serif",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: 'var(--success-500)',
              secondary: 'var(--text-inverse)',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: 'var(--error-500)',
              secondary: 'var(--text-inverse)',
            },
          },
        }}
      />
    </Provider>
  </StrictMode>,
)
