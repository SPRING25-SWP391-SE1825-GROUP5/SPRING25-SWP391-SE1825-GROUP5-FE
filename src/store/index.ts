import { configureStore } from '@reduxjs/toolkit'
import auth, { logout } from './authSlice'
import promo from './promoSlice'
import cart from './cartSlice'
import { attachTokenGetter, attachUnauthorizedHandler } from '@/services/api'

export const store = configureStore({
  reducer: {
    auth,
    promo,
    cart,
  },
})

// Wire axios to Redux store without creating circular imports
attachTokenGetter(() => {
  try {
    return store.getState().auth.token
  } catch {
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
