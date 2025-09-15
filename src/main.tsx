import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.scss'
import { AppRouter } from './router'
import { Provider } from 'react-redux'
import { store } from './store'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <AppRouter />
    </Provider>
  </StrictMode>,
)
