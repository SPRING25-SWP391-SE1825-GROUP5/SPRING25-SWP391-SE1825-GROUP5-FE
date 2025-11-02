import { configureStore } from '@reduxjs/toolkit'
import auth, { logout } from './authSlice'
import promo from './promoSlice'
import cart from './cartSlice'
import chat from './chatSlice'
import { attachTokenGetter, attachUnauthorizedHandler } from '@/services/api'

export const store = configureStore({
  reducer: {
    auth,
    promo,
    cart,
    chat,
  },
})

// Wire axios to Redux store without creating circular imports
// This ensures token is always available, even if Redux store is not ready yet
attachTokenGetter(() => {
  try {
    const state = store.getState()
    const token = state.auth.token

    // If Redux token is null but localStorage has token, return localStorage token
    // This handles timing issues during app initialization
    if (!token && typeof localStorage !== 'undefined') {
      const localToken = localStorage.getItem('authToken') || localStorage.getItem('token')
      return localToken
    }

    return token
  } catch {
    // Fallback to localStorage if Redux store access fails
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('authToken') || localStorage.getItem('token')
    }
    return null
  }
})

attachUnauthorizedHandler(() => {
  try {
    store.dispatch(logout())
  } catch {
    // no-op
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
