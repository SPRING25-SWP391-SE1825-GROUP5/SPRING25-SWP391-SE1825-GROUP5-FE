import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface Promotion {
  id: string
  code: string
  title: string
  description: string
  type: 'percentage' | 'fixed' | 'shipping'
  value: number // percentage (1-100) or fixed amount
  minOrder?: number // minimum order amount to apply
  maxDiscount?: number // maximum discount for percentage promos
  validFrom: string
  validTo: string
  isActive: boolean
  usageLimit?: number
  usedCount: number
  category?: string[]
  image?: string
}

interface PromoState {
  savedPromotions: Promotion[]
  appliedPromo: Promotion | null
  availablePromotions: Promotion[]
}

// TODO: Replace with real API data
const savedPromotions: Promotion[] = []

const initialState: PromoState = {
  savedPromotions: [],
  appliedPromo: null,
  availablePromotions: []
}

const promoSlice = createSlice({
  name: 'promo',
  initialState,
  reducers: {
    applyPromotion: (state, action: PayloadAction<Promotion>) => {
      state.appliedPromo = action.payload
    },

    removePromotion: (state) => {
      state.appliedPromo = null
    },

    savePromotion: (state, action: PayloadAction<Promotion>) => {
      const existing = state.savedPromotions.find(p => p.id === action.payload.id)
      if (!existing) {
        state.savedPromotions.push(action.payload)
      }
    },

    unsavePromotion: (state, action: PayloadAction<string>) => {
      state.savedPromotions = state.savedPromotions.filter(p => p.id !== action.payload)
    },

    setAvailablePromotions: (state, action: PayloadAction<Promotion[]>) => {
      state.availablePromotions = action.payload
    },

    clearAllSavedPromotions: (state) => {
      state.savedPromotions = []
    }
  }
})

export const {
  applyPromotion,
  removePromotion,
  savePromotion,
  unsavePromotion,
  setAvailablePromotions,
  clearAllSavedPromotions
} = promoSlice.actions

export default promoSlice.reducer
