import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface CartItem {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  brand: string
  quantity: number
  category: string
  inStock: boolean
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  total: number
  itemCount: number
  cartId?: number | null
}

const loadCartFromStorage = (): CartState => {
  try {
    if (typeof localStorage === 'undefined') {
      return { items: [], isOpen: false, total: 0, itemCount: 0, cartId: undefined }
    }
    const raw = localStorage.getItem('cartItems')
    const storedItems: CartItem[] = raw ? JSON.parse(raw) : []
    const totals = calculateCartTotals(storedItems)
    const storedCartId = localStorage.getItem('cartId')
    return {
      items: storedItems || [],
      isOpen: false,
      total: totals.total,
      itemCount: totals.itemCount,
      cartId: storedCartId ? Number(storedCartId) : undefined,
    }
  } catch {
    return { items: [], isOpen: false, total: 0, itemCount: 0, cartId: undefined }
  }
}

const initialState: CartState = loadCartFromStorage()

const persistCart = (state: CartState) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cartItems', JSON.stringify(state.items))
      if (state.cartId !== undefined) {
        localStorage.setItem('cartId', String(state.cartId ?? ''))
      }
    }
  } catch { /* ignore */ }
}

const calculateCartTotals = (items: CartItem[]) => {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  return { itemCount, total }
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Omit<CartItem, 'quantity'>>) => {
      const existingItem = state.items.find(item => item.id === action.payload.id)
      
      if (existingItem) {
        existingItem.quantity += 1
      } else {
        state.items.push({ ...action.payload, quantity: 1 })
      }
      
      const totals = calculateCartTotals(state.items)
      state.itemCount = totals.itemCount
      state.total = totals.total
      persistCart(state)
    },
    
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload)
      
      const totals = calculateCartTotals(state.items)
      state.itemCount = totals.itemCount
      state.total = totals.total
      persistCart(state)
    },
    
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find(item => item.id === action.payload.id)
      
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter(item => item.id !== action.payload.id)
        } else {
          item.quantity = action.payload.quantity
        }
        
        const totals = calculateCartTotals(state.items)
        state.itemCount = totals.itemCount
        state.total = totals.total
        persistCart(state)
      }
    },
    
    clearCart: (state) => {
      state.items = []
      state.itemCount = 0
      state.total = 0
      persistCart(state)
    },
    
    toggleCart: (state) => {
      state.isOpen = !state.isOpen
    },
    
    setCartOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload
    },

    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload || []
      const totals = calculateCartTotals(state.items)
      state.itemCount = totals.itemCount
      state.total = totals.total
      persistCart(state)
    },

    setCartId: (state, action: PayloadAction<number | null | undefined>) => {
      state.cartId = action.payload ?? null
      persistCart(state)
    }
  }
})

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  toggleCart,
  setCartOpen,
  setCartItems,
  setCartId
} = cartSlice.actions

export default cartSlice.reducer
