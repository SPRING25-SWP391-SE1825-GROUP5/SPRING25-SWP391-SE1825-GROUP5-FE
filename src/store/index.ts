import { configureStore, type Middleware } from '@reduxjs/toolkit'
import auth, { logout } from './authSlice'
import promo from './promoSlice'
import cart, { clearCartForUser, loadCartForUser } from './cartSlice'
import chat from './chatSlice'
import { attachTokenGetter, attachUnauthorizedHandler } from '@/services/api'

// Middleware to handle cart loading/clearing when user changes
const cartUserMiddleware: Middleware = (store) => (next) => (action) => {
  const prevState = store.getState()
  const prevUserId = prevState.auth.user?.id
  
  const result = next(action)
  const state = store.getState()
  const currentUserId = state.auth.user?.id

  // When user logs in, load their cart
  if (action.type === 'auth/login/fulfilled' || action.type === 'auth/loginWithGoogle/fulfilled') {
    if (currentUserId) {
      store.dispatch(loadCartForUser(currentUserId))
    }
  }

  // When user logs out, clear cart
  if (action.type === 'auth/logout') {
    store.dispatch(clearCartForUser())
  }

  // When user changes (different user logs in), clear old cart and load new one
  if (prevUserId !== currentUserId && prevUserId !== undefined) {
    if (prevUserId !== null) {
      // Clear cart for previous user
      store.dispatch(clearCartForUser())
    }
    if (currentUserId) {
      // Load cart for new user
      store.dispatch(loadCartForUser(currentUserId))
    }
  }

  // On initial sync from localStorage, load cart if user exists
  if (action.type === 'auth/syncFromLocalStorage' && currentUserId && !prevUserId) {
    store.dispatch(loadCartForUser(currentUserId))
  }

  return result
}

export const store = configureStore({
  reducer: {
    auth,
    promo,
    cart,
    chat,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(cartUserMiddleware),
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
