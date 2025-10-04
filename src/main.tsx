import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.scss'
import './styles/scrollbar.scss'
import { AppRouter } from './router'
import { Provider } from 'react-redux'
import { store } from './store'
import { Toaster } from 'react-hot-toast'
import LoginToastWatcher from '@/components/common/LoginToastWatcher'

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
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </Provider>
  </StrictMode>,
)
