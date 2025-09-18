import { configureStore } from '@reduxjs/toolkit'
import auth from './authSlice'
import promo from './promoSlice'
import cart from './cartSlice'

export const store = configureStore({
  reducer: {
    auth,
    promo,
    cart,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

