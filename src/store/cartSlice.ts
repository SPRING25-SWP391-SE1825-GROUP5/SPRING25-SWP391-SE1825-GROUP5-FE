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
  fulfillmentCenterId?: number  // Center được chọn từ FE khi add to cart
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  total: number
  itemCount: number
  cartId?: number | null
}

// Helper to get localStorage keys for a specific user
const getCartStorageKey = (userId: number | null | undefined): string => {
  if (!userId) return 'cartItems_guest'
  return `cartItems_${userId}`
}

const getCartIdStorageKey = (userId: number | null | undefined): string => {
  if (!userId) return 'cartId_guest'
  return `cartId_${userId}`
}

const loadCartFromStorage = (userId: number | null | undefined): CartState => {
  try {
    if (typeof localStorage === 'undefined') {
      return { items: [], isOpen: false, total: 0, itemCount: 0, cartId: undefined }
    }
    const key = getCartStorageKey(userId)
    const idKey = getCartIdStorageKey(userId)
    const raw = localStorage.getItem(key)
    const storedItems: CartItem[] = raw ? JSON.parse(raw) : []
    const totals = calculateCartTotals(storedItems)
    const storedCartId = localStorage.getItem(idKey)
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

// Initial state - will be reset when user logs in
const initialState: CartState = { items: [], isOpen: false, total: 0, itemCount: 0, cartId: undefined }

const persistCart = (state: CartState, userId: number | null | undefined) => {
  try {
    if (typeof localStorage !== 'undefined') {
      const key = getCartStorageKey(userId)
      const idKey = getCartIdStorageKey(userId)
      localStorage.setItem(key, JSON.stringify(state.items))
      if (state.cartId !== undefined) {
        localStorage.setItem(idKey, String(state.cartId ?? ''))
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
    addToCart: (state, action: PayloadAction<{ item: Omit<CartItem, 'quantity'>; userId?: number | null }>) => {
      const existingItem = state.items.find(item => item.id === action.payload.item.id)
      
      if (existingItem) {
        existingItem.quantity += 1
      } else {
        state.items.push({ ...action.payload.item, quantity: 1 })
      }
      
      const totals = calculateCartTotals(state.items)
      state.itemCount = totals.itemCount
      state.total = totals.total
      persistCart(state, action.payload.userId)
    },
    
    removeFromCart: (state, action: PayloadAction<{ id: string; userId?: number | null }>) => {
      state.items = state.items.filter(item => item.id !== action.payload.id)
      
      const totals = calculateCartTotals(state.items)
      state.itemCount = totals.itemCount
      state.total = totals.total
      persistCart(state, action.payload.userId)
    },
    
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number; userId?: number | null }>) => {
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
        persistCart(state, action.payload.userId)
      }
    },
    
    clearCart: (state, action: PayloadAction<{ userId?: number | null }>) => {
      state.items = []
      state.itemCount = 0
      state.total = 0
      state.cartId = undefined
      persistCart(state, action.payload?.userId)
    },
    
    toggleCart: (state) => {
      state.isOpen = !state.isOpen
    },
    
    setCartOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload
    },

    setCartItems: (state, action: PayloadAction<{ items: CartItem[]; userId?: number | null }>) => {
      state.items = action.payload.items || []
      const totals = calculateCartTotals(state.items)
      state.itemCount = totals.itemCount
      state.total = totals.total
      persistCart(state, action.payload.userId)
    },

    setCartId: (state, action: PayloadAction<{ cartId: number | null | undefined; userId?: number | null }>) => {
      state.cartId = action.payload.cartId ?? null
      persistCart(state, action.payload.userId)
    },

    loadCartForUser: (state, action: PayloadAction<number | null | undefined>) => {
      const loaded = loadCartFromStorage(action.payload)
      state.items = loaded.items
      state.itemCount = loaded.itemCount
      state.total = loaded.total
      state.cartId = loaded.cartId
      state.isOpen = false
    },

    clearCartForUser: (state) => {
      state.items = []
      state.itemCount = 0
      state.total = 0
      state.cartId = undefined
      state.isOpen = false
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
  setCartId,
  loadCartForUser,
  clearCartForUser
} = cartSlice.actions

export default cartSlice.reducer
